import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const ADMIN_PASSWORD = "V@c@R1A2026";

export default function AdminPanel({ onClose }) {
  const [auth, setAuth] = useState(false);
  const [senha, setSenha] = useState("");
  const [erroSenha, setErroSenha] = useState(false);
  const [accessLogs, setAccessLogs] = useState([]);
  const [interactionLogs, setInteractionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState("acessos");

  function handleLogin() {
    if (senha === ADMIN_PASSWORD) {
      setAuth(true);
      fetchData();
    } else {
      setErroSenha(true);
    }
  }

  async function fetchData() {
    setLoading(true);
    const { data: acessos } = await supabase
      .from("access_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    const { data: interacoes } = await supabase
      .from("interaction_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    setAccessLogs(acessos || []);
    setInteractionLogs(interacoes || []);
    setLoading(false);
  }

  function formatDate(ts) {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("pt-BR");
  }

  if (!auth) {
    return (
      <div style={styles.overlay}>
        <div style={styles.loginBox}>
          <h2 style={styles.title}>🔒 Painel Admin</h2>
          <input
            type="password"
            placeholder="Digite a senha"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErroSenha(false); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={styles.input}
          />
          {erroSenha && <p style={styles.erro}>Senha incorreta!</p>}
          <button onClick={handleLogin} style={styles.btnLogin}>Entrar</button>
          <button onClick={onClose} style={styles.btnFechar}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.painel}>
        <div style={styles.header}>
          <h2 style={styles.title}>📊 Painel de Gestão — VacarIA</h2>
          <button onClick={onClose} style={styles.btnX}>✕</button>
        </div>

        {/* CARDS RESUMO */}
        <div style={styles.cardsRow}>
          <div style={styles.card}>
            <div style={styles.cardNum}>{accessLogs.length}</div>
            <div style={styles.cardLabel}>Acessos registrados</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardNum}>{interactionLogs.length}</div>
            <div style={styles.cardLabel}>Interações registradas</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardNum}>
              {[...new Set(accessLogs.map(l => l.ip_address))].length}
            </div>
            <div style={styles.cardLabel}>IPs únicos</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardNum}>
              {[...new Set(accessLogs.map(l => l.ip_location).filter(Boolean))].length}
            </div>
            <div style={styles.cardLabel}>Localizações únicas</div>
          </div>
        </div>

        {/* ABAS */}
        <div style={styles.abas}>
          <button onClick={() => setAba("acessos")} style={aba === "acessos" ? styles.abaAtiva : styles.aba}>
            🌐 Acessos
          </button>
          <button onClick={() => setAba("interacoes")} style={aba === "interacoes" ? styles.abaAtiva : styles.aba}>
            💬 Interações
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#aaa" }}>Carregando...</p>
        ) : aba === "acessos" ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data/Hora</th>
                  <th style={styles.th}>IP</th>
                  <th style={styles.th}>Localização</th>
                  <th style={styles.th}>Dispositivo</th>
                  <th style={styles.th}>Browser</th>
                  <th style={styles.th}>Página</th>
                </tr>
              </thead>
              <tbody>
                {accessLogs.map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>{formatDate(log.timestamp)}</td>
                    <td style={styles.td}>{log.ip_address}</td>
                    <td style={styles.td}>{log.ip_location}</td>
                    <td style={styles.td}>{log.device_type}</td>
                    <td style={styles.td}>{log.browser_name}</td>
                    <td style={styles.td}>{log.page_path}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data/Hora</th>
                  <th style={styles.th}>IP</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Feature</th>
                  <th style={styles.th}>Prompt</th>
                  <th style={styles.th}>Sucesso</th>
                </tr>
              </thead>
              <tbody>
                {interactionLogs.map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>{formatDate(log.timestamp)}</td>
                    <td style={styles.td}>{log.ip_address}</td>
                    <td style={styles.td}>{log.interaction_type}</td>
                    <td style={styles.td}>{log.feature_used}</td>
                    <td style={{...styles.td, maxWidth:"200px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{log.prompt_text}</td>
                    <td style={styles.td}>{log.success ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" },
  loginBox: { background:"#1a1a2e", borderRadius:"12px", padding:"40px", display:"flex", flexDirection:"column", gap:"12px", minWidth:"300px", alignItems:"center" },
  painel: { background:"#1a1a2e", borderRadius:"12px", padding:"24px", width:"95vw", maxWidth:"1100px", maxHeight:"90vh", overflowY:"auto", display:"flex", flexDirection:"column", gap:"16px" },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  title: { color:"#fff", margin:0, fontSize:"1.3rem" },
  input: { padding:"10px 16px", borderRadius:"8px", border:"1px solid #444", background:"#0f0f1a", color:"#fff", fontSize:"1rem", width:"100%" },
  erro: { color:"#ff6b6b", margin:0, fontSize:"0.85rem" },
  btnLogin: { background:"#6c63ff", color:"#fff", border:"none", borderRadius:"8px", padding:"10px 24px", cursor:"pointer", fontSize:"1rem", width:"100%" },
  btnFechar: { background:"transparent", color:"#aaa", border:"1px solid #444", borderRadius:"8px", padding:"8px 24px", cursor:"pointer", fontSize:"0.9rem", width:"100%" },
  btnX: { background:"transparent", color:"#aaa", border:"none", fontSize:"1.4rem", cursor:"pointer" },
  cardsRow: { display:"flex", gap:"12px", flexWrap:"wrap" },
  card: { background:"#0f0f1a", borderRadius:"10px", padding:"16px 24px", flex:"1", minWidth:"120px", textAlign:"center" },
  cardNum: { fontSize:"2rem", fontWeight:"bold", color:"#6c63ff" },
  cardLabel: { fontSize:"0.8rem", color:"#aaa", marginTop:"4px" },
  abas: { display:"flex", gap:"8px" },
  aba: { background:"#0f0f1a", color:"#aaa", border:"1px solid #333", borderRadius:"8px", padding:"8px 20px", cursor:"pointer" },
  abaAtiva: { background:"#6c63ff", color:"#fff", border:"none", borderRadius:"8px", padding:"8px 20px", cursor:"pointer" },
  tableWrap: { overflowX:"auto" },
  table: { width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" },
  th: { background:"#0f0f1a", color:"#6c63ff", padding:"10px 12px", textAlign:"left", borderBottom:"1px solid #333" },
  tr: { borderBottom:"1px solid #222" },
  td: { color:"#ddd", padding:"8px 12px" },
};