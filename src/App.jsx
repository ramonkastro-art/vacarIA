import { useState, useEffect } from "react";

// Chave protegida no servidor — não fica exposta no frontend

const ANOS = [
  "Pré Escola","1º Ano","2º Ano","3º Ano","4º Ano","5º Ano",
  "6º Ano","7º Ano","8º Ano","9º Ano"
];

function buildPrompt(ano, tema) {
  return `Você é um especialista pedagógico em Língua Inglesa da Rede Municipal de Vacaria/RS, com domínio profundo de:
- BNCC (Base Nacional Comum Curricular) — Componente: Língua Inglesa
- Referencial Curricular Gaúcho (BNCC + adaptações RS)
- DCOMVAC (Documento Curricular Orientador Municipal de Vacaria/RS)
- Sistema de Ensino Aprende Brasil (Grupo Positivo) — Componente Língua Inglesa

═══════════════════════════════════════
RESTRIÇÕES ABSOLUTAS
═══════════════════════════════════════

RESTRIÇÃO 1 — DISCIPLINA EXCLUSIVA:
Este plano é ESTRITAMENTE de LÍNGUA INGLESA.
Independente do tema "${tema}", estruture a aula como aula de Inglês.
Exemplo: tema "Números" → ensine numbers em inglês (one, two, three...).

RESTRIÇÃO 2 — IDIOMA DO PLANO:
O plano deve estar 100% em PORTUGUÊS BRASILEIRO, escrito com clareza para professores sem fluência em inglês.
Use inglês apenas para vocabulário-alvo, comandos pedagógicos e estruturas gramaticais que serão ensinados.

RESTRIÇÃO 3 — BNCC (OBRIGATÓRIO, verbatim):
Use SOMENTE códigos e descrições EXATOS da BNCC oficial para Língua Inglesa.
NÃO parafraseie, NÃO invente códigos. Selecione 2 a 4 habilidades reais e relevantes ao tema e ao ${ano}.
Padrões: EF06LIxx (6º ano), EF07LIxx (7º ano), EF08LIxx (8º ano), EF09LIxx (9º ano). Para EF I, use EF15LIxx ou EF35LIxx conforme o caso.

RESTRIÇÃO 4 — REFERENCIAL GAÚCHO:
Quando existir adaptação gaúcha, use sufixo RS (ex: EF06LI01RS).
Contextualize com identidade gaúcha, cultura local e cotidiano escolar do RS.

RESTRIÇÃO 5 — APRENDE BRASIL:
Alinhe com o currículo do Sistema Aprende Brasil (Grupo Positivo), indicando Volume/Unidade relevantes nas Referências.

═══════════════════════════════════════
ESTRUTURA DO PLANO (siga exatamente)
═══════════════════════════════════════

# Plano de Aula — Língua Inglesa
**Tema:** ${tema}
**Série:** ${ano} | **Duração:** 40 minutos | **Componente:** Língua Inglesa

## Habilidades BNCC Alinhadas
[Liste 2–4 habilidades com código exato e descrição verbatim da BNCC. Use códigos de Língua Inglesa apenas.]

## Objetivos de Aprendizagem
• [Objetivo 1 — o que o aluno saberá/poderá fazer ao final, em português]
• [Objetivo 2]
• [Objetivo 3 — opcional]

## Materiais Necessários
• [Material 1]
• [Material 2]
• [Ferramenta digital gratuita, se aplicável: nome + link]

## Estrutura da Aula (40 minutos)

### 1. Aquecimento — Warm Up (5–8 min)
[Descreva em português a atividade de engajamento inicial. Inclua o que o professor fala/faz passo a passo.]

### 2. Apresentação — Presentation (10–12 min)
[Descreva em português como introduzir o vocabulário/estrutura-alvo. Exemplos concretos com inglês entre parênteses.]

### 3. Prática — Practice (12–15 min)
[Descreva em português as atividades de prática guiada. Inclua variações para diferentes ritmos de aprendizagem.]

### 4. Produção — Production (5–8 min)
[Descreva em português a atividade de produção livre ou semi-guiada.]

### 5. Fechamento — Wrap Up (3–5 min)
[Descrição em português do encerramento: recapitulação, saída comunicativa, etc.]

## Avaliação
[2–4 linhas em português: critérios observáveis, estratégias formativas, registros sugeridos.]

## Adaptação para Inclusão / Diversidade
[3–5 linhas: adaptações para NEE, diferentes ritmos, realidade gaúcha/rural/indígena se aplicável.]

## Referências e Recursos Complementares
[Livro didático Aprende Brasil com Volume/Unidade; apps, sites ou vídeos gratuitos úteis.]

═══════════════════════════════════════
INSTRUÇÕES FINAIS
═══════════════════════════════════════
- Gere SOMENTE o plano acima, sem introduções, cumprimentos ou conclusões extras.
- Máximo 2 páginas A4.
- Use linguagem simples e instrutiva, como um formador pedagógico experiente.
- Seja específico nos passos do professor — evite instruções vagas como "realize uma atividade".
- Vocabulário-alvo em inglês SEMPRE entre parênteses ou em negrito, com tradução quando necessário.`;
}

async function callGrok(ano, tema) {
  const prompt = buildPrompt(ano, tema);
  const response = await fetch("/api/grok", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-4-latest",
      messages: [
        {
          role: "system",
          content: "Você é um especialista pedagógico em Língua Inglesa da Rede Municipal de Vacaria/RS. Responda sempre em português brasileiro, com precisão técnica e linguagem acessível a professores.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.65,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Erro Grok: ${err.error?.message || response.statusText}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0)
    throw new Error("A API Grok retornou uma resposta vazia.");
  return content;
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div className="spinner" />
      <p style={{ color: "#92400e", fontSize: 14, fontFamily: "'Space Mono', monospace" }}>
        Gerando plano com IA...
      </p>
    </div>
  );
}

function MarkdownOutput({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "#1e293b", lineHeight: 1.75, fontSize: 15 }}>
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return <h1 key={i} style={{ fontSize: 22, fontWeight: 800, color: "#b45309", fontFamily: "'Space Mono', monospace", marginTop: 8, marginBottom: 12, borderBottom: "2px solid #fde68a", paddingBottom: 8 }}>{line.slice(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} style={{ fontSize: 14, fontWeight: 700, color: "#0e7490", fontFamily: "'Space Mono', monospace", marginTop: 24, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", fontFamily: "'Space Mono', monospace", marginTop: 16, marginBottom: 6 }}>{line.slice(4)}</h3>;
        }
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
          return <p key={i} style={{ fontWeight: 700, color: "#0f172a", margin: "4px 0" }}>{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("• ") || line.startsWith("- ")) {
          const content = line.slice(2);
          return (
            <div key={i} style={{ display: "flex", gap: 10, margin: "3px 0", paddingLeft: 4 }}>
              <span style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }}>▸</span>
              <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#92400e">$1</strong>') }} />
            </div>
          );
        }
        if (line.startsWith("═")) {
          return null;
        }
        if (line.trim() === "---") {
          return <hr key={i} style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />;
        }
        if (line.trim() === "") {
          return <div key={i} style={{ height: 6 }} />;
        }
        const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#92400e">$1</strong>');
        return <p key={i} style={{ margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: bold }} />;
      })}
    </div>
  );
}

export default function App() {
  const [ano, setAno] = useState("");
  const [tema, setTema] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!ano || !tema.trim()) {
      setError("Selecione o ano e digite o tema da aula.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const text = await callGrok(ano, tema);
      setResult(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          background: #fefce8;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          background: #fefce8;
          background-image: 
            radial-gradient(ellipse at 15% 0%, rgba(251,191,36,0.18) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 100%, rgba(14,116,144,0.08) 0%, transparent 45%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 16px 60px;
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(180,83,9,0.08);
          border: 1px solid rgba(180,83,9,0.2);
          border-radius: 100px;
          padding: 6px 16px;
          margin-bottom: 20px;
        }

        .logo-dot {
          width: 8px;
          height: 8px;
          background: #d97706;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .logo-badge span {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #92400e;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .title {
          font-family: 'Space Mono', monospace;
          font-size: clamp(42px, 8vw, 72px);
          font-weight: 700;
          color: #b45309;
          letter-spacing: -2px;
          line-height: 1;
          margin-bottom: 12px;
        }

        .title span {
          color: #0e7490;
        }

        .subtitle {
          font-size: 15px;
          color: #78716c;
          font-weight: 400;
          max-width: 400px;
          line-height: 1.6;
        }

        .card {
          width: 100%;
          max-width: 560px;
          background: #ffffff;
          border: 1px solid #fde68a;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 6px rgba(180,83,9,0.04), 0 10px 40px rgba(180,83,9,0.08);
        }

        .field {
          margin-bottom: 24px;
        }

        .field label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #92400e;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .select, .textarea {
          width: 100%;
          background: #fffbeb;
          border: 1.5px solid #fde68a;
          border-radius: 10px;
          color: #1c1917;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 15px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }

        .select:focus, .textarea:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217,119,6,0.12);
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper::after {
          content: '▾';
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #a16207;
          pointer-events: none;
          font-size: 12px;
        }

        .textarea {
          resize: vertical;
          min-height: 100px;
          line-height: 1.6;
        }

        .textarea::placeholder {
          color: #c4b59a;
        }

        select option {
          background: #fffbeb;
          color: #1c1917;
        }

        .btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border: none;
          border-radius: 10px;
          color: #ffffff;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(180,83,9,0.3);
        }

        .btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 6px 24px rgba(180,83,9,0.4);
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 16px;
          color: #b91c1c;
          font-size: 14px;
          margin-top: 16px;
        }

        .result-card {
          width: 100%;
          max-width: 760px;
          background: #ffffff;
          border: 1px solid #fde68a;
          border-radius: 16px;
          margin-top: 32px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(180,83,9,0.04), 0 10px 40px rgba(180,83,9,0.08);
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          background: #fffbeb;
          border-bottom: 1px solid #fde68a;
        }

        .result-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .result-tag {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #92400e;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
        }

        .grok-badge {
          background: rgba(14,116,144,0.08);
          border: 1px solid rgba(14,116,144,0.2);
          border-radius: 100px;
          padding: 3px 10px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #0e7490;
        }

        .copy-btn {
          background: #ffffff;
          border: 1.5px solid #fde68a;
          border-radius: 8px;
          color: #92400e;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          background: #fef3c7;
          border-color: #d97706;
        }

        .result-body {
          padding: 28px 32px;
        }

        .loading-box {
          display: flex;
          justify-content: center;
          padding: 40px;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #fde68a;
          border-top-color: #d97706;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .footer {
          margin-top: 48px;
          text-align: center;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #d4c4a0;
          letter-spacing: 0.05em;
        }

        @media (max-width: 600px) {
          .card { padding: 24px 20px; }
          .result-body { padding: 20px; }
        }
      `}</style>

      <div className="app">
        <header className="header">
          <div className="logo-badge">
            <div className="logo-dot" />
            <span>Professores de Inglês · Vacaria/RS</span>
          </div>
          <div className="title">Vacar<span>IA</span></div>
          <p className="subtitle">
            Assistente pedagógico com IA para planejamento de aulas de Língua Inglesa
          </p>
        </header>

        <div className="card">
          <div className="field">
            <label>Ano / Série</label>
            <div className="select-wrapper">
              <select
                className="select"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              >
                <option value="">Selecione o ano...</option>
                {ANOS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Tema da Aula</label>
            <textarea
              className="textarea"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Greetings and Introductions, Verb To Be, Numbers 1–20, Colors..."
              rows={3}
            />
          </div>

          <button
            className="btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Gerando..." : "✦ Gerar Plano de Aula"}
          </button>

          {error && <div className="error-box">⚠ {error}</div>}
        </div>

        {loading && (
          <div className="result-card">
            <div className="loading-box">
              <Spinner />
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="result-card">
            <div className="result-header">
              <div className="result-header-left">
                <span className="result-tag">Plano Gerado</span>
                <span className="grok-badge">Grok-4</span>
              </div>
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? "✓ Copiado!" : "Copiar"}
              </button>
            </div>
            <div className="result-body">
              <MarkdownOutput text={result} />
            </div>
          </div>
        )}

        <footer className="footer">
          VacarIA · Secretaria Municipal de Educação · Vacaria/RS
        </footer>
      </div>
    </>
  );
}
