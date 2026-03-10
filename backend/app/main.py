"""
ExtratoConverter - Backend API
Sistema profissional de conversão de extratos bancários
"""

import os
import uuid
import asyncio
from typing import Optional
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.services.pdf_processor import PDFProcessor
from app.services.transaction_detector import TransactionDetector
from app.exporters.ofx_exporter import OFXExporter
from app.exporters.csv_exporter import CSVExporter
from app.exporters.excel_exporter import ExcelExporter
from app.models.transaction import Transaction

app = FastAPI(
    title="ExtratoConverter API",
    description="Converte extratos bancários em PDF para OFX, CSV e Excel",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diretórios de trabalho
UPLOAD_DIR = Path("/tmp/extrato_uploads")
OUTPUT_DIR = Path("/tmp/extrato_outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Cache em memória para sessões (em produção, usar Redis)
sessions: dict = {}


@app.get("/")
async def root():
    return {"message": "ExtratoConverter API v1.0", "status": "online"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Recebe um PDF de extrato bancário e inicia o processamento.
    Retorna um session_id para acompanhar o status e baixar os arquivos.
    """
    # Validação
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")
    
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Limite: 50MB")
    
    # Cria sessão
    session_id = str(uuid.uuid4())
    upload_path = UPLOAD_DIR / f"{session_id}.pdf"
    
    with open(upload_path, "wb") as f:
        f.write(content)
    
    sessions[session_id] = {
        "status": "processing",
        "filename": file.filename,
        "progress": 0,
        "transactions": [],
        "bank_detected": None,
        "error": None,
        "created_at": datetime.now().isoformat()
    }
    
    # Processa em background
    background_tasks.add_task(process_pdf, session_id, upload_path)
    
    return {
        "session_id": session_id,
        "status": "processing",
        "message": "Processamento iniciado"
    }


async def process_pdf(session_id: str, pdf_path: Path):
    """Processa o PDF em background e armazena resultado na sessão."""
    try:
        sessions[session_id]["progress"] = 10
        
        # Extrai texto do PDF
        processor = PDFProcessor()
        sessions[session_id]["progress"] = 25
        raw_text, method = await asyncio.to_thread(processor.extract_text, str(pdf_path))
        
        sessions[session_id]["progress"] = 50
        
        # Detecta banco e transações
        detector = TransactionDetector()
        bank = detector.detect_bank(raw_text)
        transactions = detector.extract_transactions(raw_text, bank)
        
        sessions[session_id]["progress"] = 70
        sessions[session_id]["bank_detected"] = bank
        
        if not transactions:
            sessions[session_id]["status"] = "error"
            sessions[session_id]["error"] = "Nenhuma transação encontrada. Verifique se o PDF é um extrato bancário válido."
            return
        
        # Gera arquivos de saída
        output_base = OUTPUT_DIR / session_id
        output_base.mkdir(exist_ok=True)
        
        # OFX
        ofx = OFXExporter()
        ofx.export(transactions, str(output_base / "extrato.ofx"), bank)
        
        # CSV
        csv_exp = CSVExporter()
        csv_exp.export(transactions, str(output_base / "extrato.csv"))
        
        # Excel
        excel = ExcelExporter()
        excel.export(transactions, str(output_base / "extrato.xlsx"), bank)
        
        sessions[session_id]["progress"] = 100
        sessions[session_id]["status"] = "completed"
        sessions[session_id]["transactions"] = [t.to_dict() for t in transactions]
        sessions[session_id]["extraction_method"] = method
        sessions[session_id]["total_transactions"] = len(transactions)
        
    except Exception as e:
        sessions[session_id]["status"] = "error"
        sessions[session_id]["error"] = str(e)
        import traceback
        print(f"[ERROR] session {session_id}: {traceback.format_exc()}")


@app.get("/status/{session_id}")
async def get_status(session_id: str):
    """Retorna o status do processamento de uma sessão."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    session = sessions[session_id]
    return {
        "session_id": session_id,
        "status": session["status"],
        "progress": session["progress"],
        "bank_detected": session.get("bank_detected"),
        "total_transactions": session.get("total_transactions", 0),
        "error": session.get("error"),
        "filename": session.get("filename")
    }


@app.get("/transactions/{session_id}")
async def get_transactions(session_id: str, page: int = 1, per_page: int = 50):
    """Retorna as transações extraídas de uma sessão."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    session = sessions[session_id]
    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Processamento não concluído")
    
    transactions = session["transactions"]
    start = (page - 1) * per_page
    end = start + per_page
    
    return {
        "total": len(transactions),
        "page": page,
        "per_page": per_page,
        "transactions": transactions[start:end],
        "bank_detected": session.get("bank_detected"),
        "summary": calculate_summary(transactions)
    }


def calculate_summary(transactions: list) -> dict:
    """Calcula resumo financeiro das transações."""
    total_credito = sum(t["valor"] for t in transactions if t["tipo"] == "credit")
    total_debito = sum(abs(t["valor"]) for t in transactions if t["tipo"] == "debit")
    
    return {
        "total_credito": round(total_credito, 2),
        "total_debito": round(total_debito, 2),
        "saldo_periodo": round(total_credito - total_debito, 2),
        "total_transacoes": len(transactions)
    }


@app.get("/download/{session_id}/{format}")
async def download_file(session_id: str, format: str):
    """Download do arquivo gerado (ofx, csv, xlsx)."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    if sessions[session_id]["status"] != "completed":
        raise HTTPException(status_code=400, detail="Processamento não concluído")
    
    format_map = {
        "ofx": ("extrato.ofx", "application/x-ofx"),
        "csv": ("extrato.csv", "text/csv"),
        "xlsx": ("extrato.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        "excel": ("extrato.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    }
    
    if format.lower() not in format_map:
        raise HTTPException(status_code=400, detail=f"Formato inválido. Use: {', '.join(format_map.keys())}")
    
    filename, media_type = format_map[format.lower()]
    file_path = OUTPUT_DIR / session_id / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=filename
    )


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Remove uma sessão e seus arquivos."""
    if session_id in sessions:
        del sessions[session_id]
    
    # Remove arquivos
    for path in [UPLOAD_DIR / f"{session_id}.pdf", OUTPUT_DIR / session_id]:
        if path.exists():
            import shutil
            shutil.rmtree(str(path)) if path.is_dir() else path.unlink()
    
    return {"message": "Sessão removida"}
