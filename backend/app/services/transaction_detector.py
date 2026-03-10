"""
Transaction Detector
Identifica o banco e extrai transações do texto bruto do extrato
"""

import re
import logging
from datetime import datetime, date
from typing import List, Optional, Tuple
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)


# Padrões de detecção de bancos
BANK_PATTERNS = {
    "Banco do Brasil": ["banco do brasil", "bb digital", "agencia bb", "bb.com.br", "0001-9"],
    "Itaú": ["itaú", "itau", "itaú unibanco", "300 - itau"],
    "Bradesco": ["bradesco", "banco bradesco", "237 - bradesco"],
    "Santander": ["santander", "banco santander", "033 - santander"],
    "Nubank": ["nubank", "nu pagamentos", "nu bank", "roxinho"],
    "C6 Bank": ["c6 bank", "banco c6", "c6bank"],
    "Inter": ["banco inter", "inter digital", "077 - inter"],
    "Caixa": ["caixa", "caixa economica", "cef", "104 - caixa"],
    "XP": ["xp investimentos", "xp bank"],
    "BTG": ["btg pactual", "btg digital"],
    "Sicredi": ["sicredi", "cooperativa sicredi"],
    "Sicoob": ["sicoob", "cooperativa sicoob"],
}


# Padrões de data suportados
DATE_PATTERNS = [
    r"\b(\d{2})/(\d{2})/(\d{4})\b",    # DD/MM/AAAA
    r"\b(\d{2})/(\d{2})/(\d{2})\b",    # DD/MM/AA
    r"\b(\d{2})\.(\d{2})\.(\d{4})\b",  # DD.MM.AAAA
    r"\b(\d{2})-(\d{2})-(\d{4})\b",    # DD-MM-AAAA
    r"\b(\d{4})-(\d{2})-(\d{2})\b",    # AAAA-MM-DD
]

# Padrões de valor monetário
MONEY_PATTERNS = [
    r"R\$\s*([\d.,]+)",                    # R$ 1.234,56
    r"([\d]{1,3}(?:\.[\d]{3})*,[\d]{2})", # 1.234,56
    r"([\d]+,[\d]{2})",                    # 123,45
    r"([\d]+\.[\d]{2})\b",                 # 123.45 (inglês)
]


def parse_date(date_str: str) -> Optional[date]:
    """Converte string de data para objeto date."""
    formats = [
        "%d/%m/%Y", "%d/%m/%y",
        "%d.%m.%Y", "%d-%m-%Y",
        "%Y-%m-%d", "%Y/%m/%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None


def parse_money(value_str: str) -> float:
    """Converte string de valor para float."""
    # Remove R$, espaços, pontos de milhar e converte vírgula para ponto
    cleaned = re.sub(r"[R$\s]", "", value_str)
    
    # Formato brasileiro: 1.234,56
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


class TransactionDetector:
    """
    Detecta banco e extrai transações de texto de extratos bancários.
    """

    def detect_bank(self, text: str) -> str:
        """Detecta o banco pelo conteúdo do texto."""
        text_lower = text.lower()
        for bank, patterns in BANK_PATTERNS.items():
            if any(p in text_lower for p in patterns):
                return bank
        return "Banco Desconhecido"

    def extract_transactions(self, text: str, bank: str = None) -> List[Transaction]:
        """Extrai transações do texto do extrato."""
        transactions = []
        
        # Tenta parsers específicos por banco
        if bank:
            if "Nubank" in bank:
                transactions = self._parse_nubank(text)
            elif "Itaú" in bank or "Itau" in bank:
                transactions = self._parse_itau(text)
            elif "Bradesco" in bank:
                transactions = self._parse_bradesco(text)
            elif "Banco do Brasil" in bank:
                transactions = self._parse_bb(text)
            elif "Santander" in bank:
                transactions = self._parse_santander(text)
        
        # Fallback: parser genérico
        if not transactions:
            transactions = self._parse_generic(text)
        
        logger.info(f"Extraídas {len(transactions)} transações ({bank or 'genérico'})")
        return transactions

    def _parse_generic(self, text: str) -> List[Transaction]:
        """
        Parser genérico que tenta encontrar padrões de data + descrição + valor.
        Funciona para a maioria dos bancos.
        """
        transactions = []
        lines = text.split("\n")
        
        # Padrão: DATA DESCRIÇÃO VALOR (com possível sinal)
        # Ex: 15/01/2024  PAGAMENTO PIX JOAO    -150,00    5.000,00
        pattern = re.compile(
            r"(\d{2}[/.\-]\d{2}[/.\-]\d{2,4})"     # Data
            r"\s+"
            r"(.+?)"                                   # Descrição
            r"\s+"
            r"([+-]?\s*(?:R\$\s*)?[\d.,]+)"           # Valor
            r"(?:\s+([+-]?\s*(?:R\$\s*)?[\d.,]+))?"   # Saldo (opcional)
        )
        
        for line in lines:
            line = line.strip()
            if len(line) < 15:
                continue
            
            match = pattern.search(line)
            if match:
                date_str, desc, value_str, balance_str = match.groups()
                
                parsed_date = parse_date(date_str)
                if not parsed_date:
                    continue
                
                # Determina sinal/tipo
                value_raw = value_str.strip()
                is_debit = "-" in value_raw or any(
                    kw in desc.lower() for kw in
                    ["pagamento", "compra", "débito", "saque", "tarifa", "iof", "pix enviado", "ted enviada"]
                )
                
                value = parse_money(value_raw)
                if value == 0:
                    continue
                
                tipo = "debit" if is_debit or value < 0 else "credit"
                saldo = parse_money(balance_str) if balance_str else None
                
                transactions.append(Transaction(
                    data=parsed_date,
                    descricao=desc.strip()[:200],
                    valor=abs(value),
                    tipo=tipo,
                    saldo=saldo
                ))
        
        # Se não encontrou com padrão completo, tenta linha a linha mais flexível
        if not transactions:
            transactions = self._parse_flexible(text)
        
        return transactions

    def _parse_flexible(self, text: str) -> List[Transaction]:
        """Parser mais flexível para layouts não convencionais."""
        transactions = []
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Detecta linha com data
            date_match = re.search(r"(\d{2}[/.\-]\d{2}[/.\-]\d{2,4})", line)
            if not date_match:
                i += 1
                continue
            
            parsed_date = parse_date(date_match.group(1))
            if not parsed_date:
                i += 1
                continue
            
            # Procura valor na mesma linha ou na próxima
            value_match = re.search(r"([+-]?\s*R?\$?\s*[\d]+[.,][\d]{2})", line)
            
            if not value_match and i + 1 < len(lines):
                value_match = re.search(r"([+-]?\s*R?\$?\s*[\d]+[.,][\d]{2})", lines[i + 1])
            
            if value_match:
                # Descrição: texto entre data e valor
                desc_start = date_match.end()
                desc_end = value_match.start() if value_match.start() > date_match.end() else len(line)
                description = line[desc_start:desc_end].strip()
                
                if not description:
                    description = f"Transação {parsed_date.strftime('%d/%m/%Y')}"
                
                value_str = value_match.group(1)
                value = parse_money(value_str)
                
                if value == 0:
                    i += 1
                    continue
                
                is_debit = "-" in value_str
                tipo = "debit" if is_debit else "credit"
                
                transactions.append(Transaction(
                    data=parsed_date,
                    descricao=description[:200],
                    valor=abs(value),
                    tipo=tipo
                ))
            
            i += 1
        
        return transactions

    def _parse_nubank(self, text: str) -> List[Transaction]:
        """Parser específico para extratos Nubank."""
        transactions = []
        
        # Nubank geralmente tem formato: DATA\nDESCRIÇÃO\nVALOR
        pattern = re.compile(
            r"(\d{2}\s+[A-Z]{3}(?:\s+\d{4})?)"  # Data: 15 JAN ou 15 JAN 2024
            r"\s+"
            r"(.+?)"
            r"\s+"
            r"R?\$?\s*([\d.,]+)"
        )
        
        for match in pattern.finditer(text):
            date_str, desc, value_str = match.groups()
            
            # Converte "15 JAN 2024" ou "15 JAN"
            months = {"JAN":1,"FEV":2,"MAR":3,"ABR":4,"MAI":5,"JUN":6,
                     "JUL":7,"AGO":8,"SET":9,"OUT":10,"NOV":11,"DEZ":12}
            
            parts = date_str.split()
            if len(parts) >= 2:
                try:
                    day = int(parts[0])
                    month = months.get(parts[1], 1)
                    year = int(parts[2]) if len(parts) > 2 else datetime.now().year
                    parsed_date = date(year, month, day)
                    value = parse_money(value_str)
                    
                    if value > 0:
                        tipo = "debit" if any(
                            kw in desc.lower() for kw in ["compra", "pagamento"]
                        ) else "credit"
                        
                        transactions.append(Transaction(
                            data=parsed_date,
                            descricao=desc.strip(),
                            valor=value,
                            tipo=tipo,
                            banco="Nubank"
                        ))
                except (ValueError, KeyError):
                    pass
        
        return transactions or self._parse_generic(text)

    def _parse_itau(self, text: str) -> List[Transaction]:
        """Parser para extratos Itaú."""
        return self._parse_generic(text)

    def _parse_bradesco(self, text: str) -> List[Transaction]:
        """Parser para extratos Bradesco."""
        return self._parse_generic(text)

    def _parse_bb(self, text: str) -> List[Transaction]:
        """Parser para extratos Banco do Brasil."""
        return self._parse_generic(text)

    def _parse_santander(self, text: str) -> List[Transaction]:
        """Parser para extratos Santander."""
        return self._parse_generic(text)
