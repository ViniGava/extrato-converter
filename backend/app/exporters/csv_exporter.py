"""
CSV Exporter - Gera arquivo CSV das transações
"""

import csv
from typing import List
from app.models.transaction import Transaction


class CSVExporter:
    """Exporta transações para CSV."""

    def export(self, transactions: List[Transaction], output_path: str):
        """Gera arquivo CSV."""
        headers = ["Data", "Descrição", "Tipo", "Débito (R$)", "Crédito (R$)", "Saldo (R$)", "Categoria"]
        
        with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f, delimiter=";")
            writer.writerow(headers)
            
            for t in transactions:
                debito = f"{t.valor_abs:.2f}".replace(".", ",") if t.tipo == "debit" else ""
                credito = f"{t.valor_abs:.2f}".replace(".", ",") if t.tipo == "credit" else ""
                saldo = f"{t.saldo:.2f}".replace(".", ",") if t.saldo is not None else ""
                data_str = t.data.strftime("%d/%m/%Y") if t.data else ""
                
                writer.writerow([
                    data_str,
                    t.descricao,
                    "Débito" if t.tipo == "debit" else "Crédito",
                    debito,
                    credito,
                    saldo,
                    t.categoria or ""
                ])
