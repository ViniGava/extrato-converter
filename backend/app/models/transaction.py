"""
Modelo de Transação Bancária
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Optional
import uuid


# Categorias automáticas por palavras-chave
CATEGORIES = {
    "Transporte": ["uber", "99", "cabify", "taxi", "bus", "metro", "bilhete", "passagem", "pedágio", "estacionamento", "posto", "combustível", "gasolina", "etanol", "abastecimento"],
    "Alimentação": ["ifood", "rappi", "uber eats", "mcdonalds", "mc donalds", "burguer", "burger", "pizza", "restaurante", "lanche", "padaria", "mercado", "supermercado", "hortifruti", "açougue"],
    "Saúde": ["farmácia", "drogaria", "drogasil", "droga raia", "ultrafarma", "hospital", "clínica", "médico", "dentista", "plano de saúde", "unimed", "bradesco saúde", "amil"],
    "Educação": ["faculdade", "escola", "colégio", "curso", "udemy", "coursera", "alura", "mensalidade escolar", "material escolar"],
    "Lazer": ["cinema", "netflix", "spotify", "amazon prime", "disney", "hbo", "globoplay", "theater", "show", "ingresso", "booking", "hotel", "viagem", "airbnb"],
    "Assinaturas": ["netflix", "spotify", "amazon", "disney", "hbo", "apple", "google", "microsoft", "adobe", "mensalidade"],
    "Compras": ["amazon", "mercado livre", "shopee", "americanas", "magazine luiza", "casas bahia", "renner", "c&a", "zara", "riachuelo"],
    "Serviços": ["luz", "energia", "cpfl", "enel", "equatorial", "água", "sabesp", "copasa", "internet", "vivo", "claro", "oi", "tim", "telefone", "celular"],
    "Financeiro": ["juros", "iof", "tarifa", "taxa", "empréstimo", "financiamento", "cartão de crédito", "fatura"],
    "PIX": ["pix recebido", "pix enviado", "transferência pix"],
    "TED/DOC": ["ted", "doc", "transferência"],
    "Salário": ["salário", "proventos", "pagamento"],
}


def categorize_transaction(description: str) -> str:
    """Categoriza automaticamente uma transação pela descrição."""
    desc_lower = description.lower()
    for category, keywords in CATEGORIES.items():
        if any(kw in desc_lower for kw in keywords):
            return category
    return "Outros"


@dataclass
class Transaction:
    """Representa uma transação bancária."""
    data: date
    descricao: str
    valor: float
    tipo: str  # 'credit' ou 'debit'
    saldo: Optional[float] = None
    categoria: Optional[str] = None
    id_unico: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    banco: Optional[str] = None

    def __post_init__(self):
        # Auto-categorizar se não tiver categoria
        if not self.categoria:
            self.categoria = categorize_transaction(self.descricao)
        
        # Garantir que débitos sejam negativos e créditos positivos
        if self.tipo == "debit" and self.valor > 0:
            self.valor = -self.valor
        elif self.tipo == "credit" and self.valor < 0:
            self.valor = abs(self.valor)

    def to_dict(self) -> dict:
        return {
            "id": self.id_unico,
            "data": self.data.isoformat() if self.data else None,
            "descricao": self.descricao,
            "valor": self.valor,
            "tipo": self.tipo,
            "saldo": self.saldo,
            "categoria": self.categoria,
            "banco": self.banco,
        }

    @property
    def valor_abs(self) -> float:
        return abs(self.valor)

    @property
    def data_ofx(self) -> str:
        """Formata data para OFX: YYYYMMDD"""
        if self.data:
            return self.data.strftime("%Y%m%d")
        return ""

    @property
    def tipo_ofx(self) -> str:
        """Tipo de transação no formato OFX."""
        return "CREDIT" if self.tipo == "credit" else "DEBIT"
