import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8000";

// ─── Icons (inline SVG components) ─────────────────────────────────────────
const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
  </svg>
);

const IconBank = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="22" x2="21" y2="22"/>
    <line x1="6" y1="18" x2="6" y2="11"/>
    <line x1="10" y1="18" x2="10" y2="11"/>
    <line x1="14" y1="18" x2="14" y2="11"/>
    <line x1="18" y1="18" x2="18" y2="11"/>
    <polygon points="12 2 20 7 4 7"/>
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

// ─── Utility ────────────────────────────────────────────────────────────────
function formatCurrency(val) {
  if (val === null || val === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

// ─── Component: Upload Zone ──────────────────────────────────────────────────
function UploadZone({ onFileSelected, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") onFileSelected(file);
  }, [onFileSelected]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isLoading && fileInputRef.current?.click()}
      style={{
        position: "relative",
        border: `2px dashed ${isDragging ? "#3b82f6" : "#334155"}`,
        borderRadius: "20px",
        padding: "60px 40px",
        textAlign: "center",
        cursor: isLoading ? "default" : "pointer",
        background: isDragging
          ? "rgba(59,130,246,0.06)"
          : "rgba(15,23,42,0.6)",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
        transform: isDragging ? "scale(1.01)" : "scale(1)",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && onFileSelected(e.target.files[0])}
      />

      {/* Animated background grid */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "18px", overflow: "hidden",
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.08) 1px, transparent 0)",
        backgroundSize: "32px 32px", pointerEvents: "none"
      }}/>

      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
        boxShadow: isDragging ? "0 0 40px rgba(59,130,246,0.4)" : "0 8px 32px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.3s",
        color: "#60a5fa",
      }}>
        <div style={{ width: 36, height: 36 }}><IconUpload /></div>
      </div>

      <p style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
        {isDragging ? "Solte o arquivo aqui" : "Arraste seu extrato bancário"}
      </p>
      <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
        ou clique para selecionar um arquivo PDF
      </p>

      <div style={{
        display: "inline-flex", gap: 8, padding: "8px 20px",
        background: "rgba(30,58,95,0.8)", borderRadius: 100,
        border: "1px solid #1e3a5f",
      }}>
        {["BB", "Itaú", "Bradesco", "Santander", "Nubank", "Inter", "C6"].map(bank => (
          <span key={bank} style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{bank}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Component: Progress Bar ─────────────────────────────────────────────────
function ProgressBar({ progress, status }) {
  const statusConfig = {
    processing: { color: "#3b82f6", label: "Processando..." },
    completed: { color: "#22c55e", label: "Concluído!" },
    error: { color: "#ef4444", label: "Erro no processamento" },
  };
  const cfg = statusConfig[status] || statusConfig.processing;

  return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 14, color: "#94a3b8" }}>{cfg.label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{progress}%</span>
      </div>
      <div style={{
        height: 8, background: "rgba(255,255,255,0.06)",
        borderRadius: 99, overflow: "hidden"
      }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
          borderRadius: 99,
          transition: "width 0.5s ease",
          boxShadow: `0 0 12px ${cfg.color}66`
        }}/>
      </div>

      {status === "processing" && (
        <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
          {["Lendo PDF", "Detectando banco", "Extraindo transações", "Gerando arquivos"].map((step, i) => (
            <div key={step} style={{
              display: "flex", alignItems: "center", gap: 6,
              opacity: progress >= (i + 1) * 25 ? 1 : 0.3,
              transition: "opacity 0.4s"
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: progress >= (i + 1) * 25 ? "#22c55e" : "#334155",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", transition: "background 0.4s"
              }}>
                {progress >= (i + 1) * 25 ? <div style={{width:10,height:10}}><IconCheck/></div> : null}
              </div>
              <span style={{ fontSize: 12, color: "#64748b" }}>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component: Transaction Table ────────────────────────────────────────────
function TransactionTable({ transactions, summary }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(t => {
    if (filter === "debit" && t.tipo !== "debit") return false;
    if (filter === "credit" && t.tipo !== "credit") return false;
    if (search && !t.descricao?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categoryColors = {
    "Transporte": "#f59e0b",
    "Alimentação": "#ef4444",
    "Saúde": "#10b981",
    "Educação": "#6366f1",
    "Lazer": "#ec4899",
    "Assinaturas": "#8b5cf6",
    "Compras": "#3b82f6",
    "Serviços": "#14b8a6",
    "Financeiro": "#64748b",
    "PIX": "#22c55e",
    "TED/DOC": "#0ea5e9",
    "Salário": "#22c55e",
    "Outros": "#475569",
  };

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Créditos", value: summary.total_credito, color: "#22c55e", icon: "↑" },
            { label: "Total Débitos", value: summary.total_debito, color: "#ef4444", icon: "↓" },
            { label: "Saldo Período", value: summary.saldo_periodo, color: summary.saldo_periodo >= 0 ? "#22c55e" : "#ef4444", icon: "=" },
          ].map(card => (
            <div key={card.label} style={{
              background: "rgba(15,23,42,0.7)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, padding: "20px 24px",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                  {card.label}
                </span>
                <span style={{ fontSize: 22, color: card.color, fontWeight: 800 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: card.color, marginTop: 8, fontFamily: "'Outfit', sans-serif" }}>
                {formatCurrency(card.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", background: "rgba(15,23,42,0.8)", borderRadius: 12, padding: 4, border: "1px solid #1e293b" }}>
          {[["all", "Todos"], ["credit", "Créditos"], ["debit", "Débitos"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: "7px 18px", borderRadius: 9, border: "none", cursor: "pointer",
              fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600,
              background: filter === val ? "#1e40af" : "transparent",
              color: filter === val ? "#fff" : "#64748b",
              transition: "all 0.2s"
            }}>
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍  Buscar transação..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "9px 16px",
            background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b",
            borderRadius: 12, color: "#f1f5f9", fontSize: 13,
            fontFamily: "'Outfit', sans-serif", outline: "none"
          }}
        />

        <span style={{ fontSize: 13, color: "#64748b" }}>
          {filtered.length} transações
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(15,23,42,0.7)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden", backdropFilter: "blur(10px)"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(30,58,95,0.5)" }}>
                {["Data", "Descrição", "Categoria", "Débito", "Crédito", "Saldo"].map(col => (
                  <th key={col} style={{
                    padding: "14px 16px", textAlign: col === "Débito" || col === "Crédito" || col === "Saldo" ? "right" : "left",
                    fontSize: 11, fontWeight: 700, color: "#64748b",
                    textTransform: "uppercase", letterSpacing: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap"
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((t, i) => (
                <tr key={t.id || i} style={{
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {formatDate(t.data)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#cbd5e1", maxWidth: 260 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.descricao}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: `${categoryColors[t.categoria] || "#475569"}22`,
                      color: categoryColors[t.categoria] || "#94a3b8",
                      border: `1px solid ${categoryColors[t.categoria] || "#475569"}44`,
                    }}>
                      {t.categoria || "Outros"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600,
                    color: t.tipo === "debit" ? "#f87171" : "transparent" }}>
                    {t.tipo === "debit" ? formatCurrency(Math.abs(t.valor)) : ""}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600,
                    color: t.tipo === "credit" ? "#4ade80" : "transparent" }}>
                    {t.tipo === "credit" ? formatCurrency(Math.abs(t.valor)) : ""}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, color: "#64748b" }}>
                    {t.saldo !== null && t.saldo !== undefined ? formatCurrency(t.saldo) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && (
          <div style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
            Mostrando 200 de {filtered.length} transações
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component: Download Panel ───────────────────────────────────────────────
function DownloadPanel({ sessionId, bankDetected }) {
  const [downloading, setDownloading] = useState({});

  const files = [
    {
      format: "ofx",
      label: "OFX",
      desc: "QuickBooks · Conta Azul · Omie · ContaLab",
      color: "#6366f1",
      ext: ".ofx",
      icon: "⚡"
    },
    {
      format: "csv",
      label: "CSV",
      desc: "Excel · Google Sheets · LibreOffice",
      color: "#0ea5e9",
      ext: ".csv",
      icon: "📊"
    },
    {
      format: "xlsx",
      label: "Excel",
      desc: "Microsoft Excel · formatado e pronto",
      color: "#22c55e",
      ext: ".xlsx",
      icon: "📗"
    },
  ];

  const handleDownload = async (format) => {
    setDownloading(d => ({ ...d, [format]: true }));
    try {
      const url = `${API_BASE}/download/${sessionId}/${format}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `extrato.${format === "xlsx" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => setDownloading(d => ({ ...d, [format]: false })), 1500);
    }
  };

  return (
    <div style={{
      background: "rgba(15,23,42,0.8)", borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "28px", backdropFilter: "blur(20px)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, #16a34a, #22c55e)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "white"
        }}>
          <div style={{ width: 20, height: 20 }}><IconCheck /></div>
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            Conversão concluída!
          </h3>
          {bankDetected && (
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Banco detectado: {bankDetected}</p>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {files.map(file => (
          <button
            key={file.format}
            onClick={() => handleDownload(file.format)}
            disabled={downloading[file.format]}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderRadius: 14, cursor: "pointer",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${file.color}33`,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${file.color}11`;
              e.currentTarget.style.borderColor = `${file.color}66`;
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.borderColor = `${file.color}33`;
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>{file.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: file.color, fontFamily: "'Outfit', sans-serif" }}>
                  {file.label}
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#475569", marginLeft: 6 }}>{file.ext}</span>
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>{file.desc}</div>
              </div>
            </div>
            <div style={{ color: file.color, width: 20, height: 20 }}>
              {downloading[file.format] ? "⟳" : <IconDownload />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState("upload"); // upload | processing | results
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const pollRef = useRef(null);

  // Poll for status during processing
  useEffect(() => {
    if (phase === "processing" && sessionId) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/status/${sessionId}`);
          const data = await res.json();
          setStatus(data);

          if (data.status === "completed") {
            clearInterval(pollRef.current);
            // Fetch transactions
            const txRes = await fetch(`${API_BASE}/transactions/${sessionId}`);
            const txData = await txRes.json();
            setTransactions(txData.transactions || []);
            setSummary(txData.summary);
            setPhase("results");
          } else if (data.status === "error") {
            clearInterval(pollRef.current);
            setError(data.error || "Erro desconhecido");
            setPhase("upload");
          }
        } catch (e) {
          console.error("Poll error:", e);
        }
      }, 1000);
    }
    return () => clearInterval(pollRef.current);
  }, [phase, sessionId]);

  const handleFileSelected = async (file) => {
    setError(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Erro no upload");
      }
      const data = await res.json();
      setSessionId(data.session_id);
      setStatus({ status: "processing", progress: 0 });
      setPhase("processing");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleReset = () => {
    setPhase("upload");
    setSessionId(null);
    setStatus({});
    setTransactions([]);
    setSummary(null);
    setError(null);
    setFileName("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020817",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: "#f1f5f9",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Background effects */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(30,64,175,0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,102,241,0.1) 0%, transparent 60%)",
      }}/>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}/>

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 40px",
        backdropFilter: "blur(20px)",
        background: "rgba(2,8,23,0.8)"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #1e40af, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)"
            }}>
              <div style={{ width: 22, height: 22, color: "white" }}><IconBank /></div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: "#f8fafc" }}>
                Extrato<span style={{ color: "#6366f1" }}>Converter</span>
              </div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>
                Conversão Profissional
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["OFX", "CSV", "XLSX"].map(fmt => (
              <span key={fmt} style={{
                padding: "4px 10px", borderRadius: 6,
                background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: 1
              }}>
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "60px 40px" }}>

        {/* Hero */}
        {phase === "upload" && (
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{
              display: "inline-block", padding: "6px 18px", borderRadius: 99,
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
              fontSize: 12, color: "#818cf8", fontWeight: 600, letterSpacing: 1,
              textTransform: "uppercase", marginBottom: 20
            }}>
              ✦ Converta em segundos
            </div>
            <h1 style={{
              fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900,
              letterSpacing: "-2px", lineHeight: 1.1, marginBottom: 20,
              background: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              Extratos bancários em<br />
              <span style={{
                background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>
                OFX, CSV e Excel
              </span>
            </h1>
            <p style={{ fontSize: 18, color: "#64748b", maxWidth: 560, margin: "0 auto" }}>
              Importe PDFs de qualquer banco brasileiro e obtenha arquivos prontos para conciliação contábil em segundos.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 14, padding: "16px 20px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <p style={{ fontWeight: 700, color: "#fca5a5", margin: 0 }}>Erro no processamento</p>
              <p style={{ color: "#ef4444", margin: 0, fontSize: 14 }}>{error}</p>
            </div>
          </div>
        )}

        {/* Upload Phase */}
        {phase === "upload" && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <UploadZone onFileSelected={handleFileSelected} isLoading={false} />
            
            {/* Features */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 32 }}>
              {[
                { icon: "🏦", title: "7+ Bancos", desc: "BB, Itaú, Bradesco, Santander, Nubank e mais" },
                { icon: "🔍", title: "OCR Inteligente", desc: "Funciona com PDFs escaneados e digitais" },
                { icon: "🏷️", title: "Categorização", desc: "Classifica automaticamente suas despesas" },
              ].map(f => (
                <div key={f.title} style={{
                  background: "rgba(15,23,42,0.6)", borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: "18px 16px", textAlign: "center"
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Phase */}
        {phase === "processing" && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{
              background: "rgba(15,23,42,0.8)", borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "36px 40px", backdropFilter: "blur(20px)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, color: "#94a3b8" }}><IconFile /></div>
                <span style={{ fontSize: 15, color: "#94a3b8", fontWeight: 500 }}>{fileName}</span>
              </div>
              <ProgressBar progress={status.progress || 0} status={status.status || "processing"} />
            </div>
          </div>
        )}

        {/* Results Phase */}
        {phase === "results" && (
          <div>
            {/* Header bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  {transactions.length} transações encontradas
                </h2>
                <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
                  {status.bank_detected || fileName}
                </p>
              </div>
              <button
                onClick={handleReset}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8", cursor: "pointer", fontSize: 14, fontFamily: "'Outfit', sans-serif"
                }}
              >
                <div style={{ width: 16, height: 16 }}><IconRefresh /></div>
                Novo arquivo
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
              {/* Transactions */}
              <TransactionTable transactions={transactions} summary={summary} />

              {/* Download sidebar */}
              <div style={{ position: "sticky", top: 24 }}>
                <DownloadPanel sessionId={sessionId} bankDetected={status.bank_detected} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.04)",
        padding: "24px 40px", textAlign: "center",
        color: "#334155", fontSize: 13, position: "relative", zIndex: 1
      }}>
        ExtratoConverter — Converta extratos bancários com segurança e precisão
      </footer>
    </div>
  );
}
