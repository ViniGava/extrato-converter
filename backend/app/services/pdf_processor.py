"""
PDF Processor - Extrai texto de extratos bancários em PDF
Suporta PDFs digitais e escaneados (via OCR)
"""

import re
import logging
from pathlib import Path
from typing import Tuple, Optional

logger = logging.getLogger(__name__)


class PDFProcessor:
    """
    Extrai texto de PDFs bancários.
    Tenta pdfplumber primeiro; fallback para OCR com pytesseract.
    """

    def extract_text(self, pdf_path: str) -> Tuple[str, str]:
        """
        Extrai texto do PDF.
        Returns: (texto_extraido, metodo_usado)
        """
        # Tenta extração direta
        text, method = self._extract_with_pdfplumber(pdf_path)
        
        if text and len(text.strip()) > 100:
            logger.info(f"Texto extraído via pdfplumber: {len(text)} chars")
            return text, method
        
        # Fallback: tenta pypdf2
        text, method = self._extract_with_pypdf2(pdf_path)
        if text and len(text.strip()) > 100:
            logger.info(f"Texto extraído via pypdf2: {len(text)} chars")
            return text, method
        
        # Último recurso: OCR
        logger.warning("PDF sem texto detectável, tentando OCR...")
        text, method = self._extract_with_ocr(pdf_path)
        return text, method

    def _extract_with_pdfplumber(self, pdf_path: str) -> Tuple[str, str]:
        """Extração usando pdfplumber (melhor para tabelas)."""
        try:
            import pdfplumber
            full_text = []
            
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    # Tenta extrair tabelas primeiro
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            for row in table:
                                if row:
                                    clean_row = [str(cell or "").strip() for cell in row]
                                    full_text.append(" | ".join(clean_row))
                    
                    # Também extrai texto corrido
                    page_text = page.extract_text()
                    if page_text:
                        full_text.append(page_text)
            
            return "\n".join(full_text), "pdfplumber"
        
        except ImportError:
            logger.warning("pdfplumber não instalado")
            return "", "none"
        except Exception as e:
            logger.error(f"Erro pdfplumber: {e}")
            return "", "none"

    def _extract_with_pypdf2(self, pdf_path: str) -> Tuple[str, str]:
        """Extração usando PyPDF2 como fallback."""
        try:
            import PyPDF2
            text_parts = []
            
            with open(pdf_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
            
            return "\n".join(text_parts), "pypdf2"
        
        except ImportError:
            try:
                import pypdf
                text_parts = []
                with open(pdf_path, "rb") as f:
                    reader = pypdf.PdfReader(f)
                    for page in reader.pages:
                        text = page.extract_text()
                        if text:
                            text_parts.append(text)
                return "\n".join(text_parts), "pypdf"
            except ImportError:
                return "", "none"
        except Exception as e:
            logger.error(f"Erro pypdf2: {e}")
            return "", "none"

    def _extract_with_ocr(self, pdf_path: str) -> Tuple[str, str]:
        """OCR para PDFs escaneados usando pytesseract."""
        try:
            from pdf2image import convert_from_path
            import pytesseract
            from PIL import Image
            
            images = convert_from_path(pdf_path, dpi=300)
            text_parts = []
            
            for img in images:
                text = pytesseract.image_to_string(
                    img,
                    lang="por",
                    config="--psm 6"
                )
                text_parts.append(text)
            
            return "\n".join(text_parts), "ocr"
        
        except ImportError:
            logger.error("OCR não disponível: instale pdf2image e pytesseract")
            return "", "none"
        except Exception as e:
            logger.error(f"Erro OCR: {e}")
            return "", "none"
