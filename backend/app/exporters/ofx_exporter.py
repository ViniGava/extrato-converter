"""
OFX Exporter - Gera arquivos OFX compatíveis com sistemas contábeis
Compatível com: QuickBooks, Conta Azul, Omie, ContaLab, etc.
"""

from datetime import datetime
from typing import List
from app.models.transaction import Transaction


class OFXExporter:
    """Gera arquivos OFX (Open Financial Exchange)."""

    def export(self, transactions: List[Transaction], output_path: str, bank_name: str = "Banco"):
        """Gera arquivo OFX com as transações."""
        now = datetime.now()
        
        # Calcula datas do período
        if transactions:
            dates = [t.data for t in transactions if t.data]
            start_date = min(dates).strftime("%Y%m%d") if dates else now.strftime("%Y%m%d")
            end_date = max(dates).strftime("%Y%m%d") if dates else now.strftime("%Y%m%d")
        else:
            start_date = end_date = now.strftime("%Y%m%d")
        
        content = self._build_ofx(transactions, bank_name, start_date, end_date, now)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

    def _build_ofx(
        self,
        transactions: List[Transaction],
        bank_name: str,
        start_date: str,
        end_date: str,
        now: datetime
    ) -> str:
        """Constrói o conteúdo OFX."""
        
        header = f"""OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0</CODE>
<SEVERITY>INFO</SEVERITY>
</STATUS>
<DTSERVER>{now.strftime("%Y%m%d%H%M%S")}</DTSERVER>
<LANGUAGE>POR</LANGUAGE>
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001</TRNUID>
<STATUS>
<CODE>0</CODE>
<SEVERITY>INFO</SEVERITY>
</STATUS>
<STMTRS>
<CURDEF>BRL</CURDEF>
<BANKACCTFROM>
<BANKID>001</BANKID>
<ACCTID>000000</ACCTID>
<ACCTTYPE>CHECKING</ACCTTYPE>
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>{start_date}</DTSTART>
<DTEND>{end_date}</DTEND>
"""

        transaction_lines = []
        for t in transactions:
            valor_str = f"{t.valor:.2f}".replace(",", ".")
            memo = self._sanitize(t.descricao)[:100]
            name = self._sanitize(t.descricao[:32])
            
            stmttrn = f"""<STMTTRN>
<TRNTYPE>{t.tipo_ofx}</TRNTYPE>
<DTPOSTED>{t.data_ofx}</DTPOSTED>
<TRNAMT>{valor_str if t.tipo == 'credit' else '-' + valor_str}</TRNAMT>
<FITID>{t.id_unico}</FITID>
<NAME>{name}</NAME>
<MEMO>{memo}</MEMO>
</STMTTRN>"""
            transaction_lines.append(stmttrn)
        
        # Saldo final (última transação com saldo)
        ledger_bal = ""
        for t in reversed(transactions):
            if t.saldo is not None:
                ledger_bal = f"""<LEDGERBAL>
<BALAMT>{t.saldo:.2f}</BALAMT>
<DTASOF>{t.data_ofx}</DTASOF>
</LEDGERBAL>"""
                break
        
        footer = f"""</BANKTRANLIST>
{ledger_bal}
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>"""

        return header + "\n".join(transaction_lines) + "\n" + footer

    def _sanitize(self, text: str) -> str:
        """Remove caracteres especiais problemáticos para OFX."""
        replacements = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text
