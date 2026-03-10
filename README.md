# 💰 ExtratoConverter

**Sistema profissional de conversão de extratos bancários em PDF para OFX, CSV e Excel.**

Desenvolvido para contadores, empresas e profissionais financeiros que precisam de conciliação bancária rápida e importação em ERPs.

---

## 🚀 Funcionalidades

- ✅ Upload por **drag-and-drop** ou clique
- ✅ Suporte a **PDFs digitais e escaneados** (OCR)
- ✅ Detecta automaticamente o banco
- ✅ Extrai transações com data, descrição, valor e tipo
- ✅ **Categorização automática** (Transporte, Alimentação, Saúde, etc.)
- ✅ Gera arquivos **OFX** (QuickBooks, Conta Azul, Omie)
- ✅ Gera **CSV** separado por ponto e vírgula
- ✅ Gera **Excel (.xlsx)** formatado e profissional
- ✅ Interface moderna e responsiva

## 🏦 Bancos Suportados

| Banco | Suporte |
|-------|---------|
| Banco do Brasil | ✅ |
| Itaú | ✅ |
| Bradesco | ✅ |
| Santander | ✅ |
| Nubank | ✅ |
| C6 Bank | ✅ |
| Inter | ✅ |
| Caixa Econômica | ✅ |
| Outros | ✅ (parser genérico) |

---

## 📦 Instalação Local

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- pip

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

A API estará disponível em: `http://localhost:8000`
Documentação Swagger: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A interface estará disponível em: `http://localhost:3000`

---

## 🐳 Docker (Recomendado)

```bash
# Subir tudo com um comando
docker-compose up --build

# Em segundo plano
docker-compose up -d --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

---

## 📡 API REST

### Upload de PDF
```http
POST /upload
Content-Type: multipart/form-data
Body: file=<arquivo.pdf>
```

**Resposta:**
```json
{
  "session_id": "uuid-aqui",
  "status": "processing"
}
```

### Verificar Status
```http
GET /status/{session_id}
```

**Resposta:**
```json
{
  "status": "completed",
  "progress": 100,
  "bank_detected": "Nubank",
  "total_transactions": 47
}
```

### Listar Transações
```http
GET /transactions/{session_id}?page=1&per_page=50
```

### Download de Arquivos
```http
GET /download/{session_id}/ofx
GET /download/{session_id}/csv
GET /download/{session_id}/xlsx
```

---

## 🗂️ Estrutura do Projeto

```
extrato-converter/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + endpoints
│   │   ├── models/
│   │   │   └── transaction.py   # Modelo de transação + categorização
│   │   ├── services/
│   │   │   ├── pdf_processor.py     # Extração de texto do PDF
│   │   │   └── transaction_detector.py  # Detecção de banco + parsing
│   │   └── exporters/
│   │       ├── ofx_exporter.py  # Geração de OFX
│   │       ├── csv_exporter.py  # Geração de CSV
│   │       └── excel_exporter.py # Geração de Excel
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Componente principal
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
```

---

## ☁️ Deploy em Produção

### Railway (Mais Fácil)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

### Render
1. Conecte o repositório GitHub
2. Crie serviço "Web Service"
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### VPS (Ubuntu)
```bash
# Instalar dependências
sudo apt update && sudo apt install -y python3-pip nodejs npm docker.io docker-compose

# Clonar e subir
git clone <seu-repo>
cd extrato-converter
docker-compose up -d --build
```

---

## 🔧 Configurações Avançadas

### Habilitar OCR (para PDFs escaneados)

Descomente no `requirements.txt`:
```
pdf2image==1.17.0
pytesseract==0.3.10
Pillow==10.3.0
```

Instale dependências do sistema:
```bash
sudo apt install -y tesseract-ocr tesseract-ocr-por poppler-utils
```

### Variáveis de Ambiente (produção)

```env
MAX_UPLOAD_SIZE_MB=50
ALLOWED_ORIGINS=https://seudominio.com
```

---

## 📋 Requisitos de Sistema

| Componente | Mínimo | Recomendado |
|-----------|--------|-------------|
| RAM | 512 MB | 2 GB |
| CPU | 1 core | 2+ cores |
| Disco | 1 GB | 5 GB |
| Python | 3.10 | 3.11+ |

---

## 📄 Licença

MIT License — use livremente em projetos pessoais e comerciais.
