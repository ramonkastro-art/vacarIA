import { useState } from "react";

const ANOS = ["Pré Escola","1º Ano","2º Ano","3º Ano","4º Ano","5º Ano","6º Ano","7º Ano","8º Ano","9º Ano"];
const DURACOES = ["1 período (40 min)","2 períodos (80 min)"];
const NIVEIS = ["Básico","Intermediário","Avançado"];
const RECURSOS = ["Quadro negro apenas","Cards / Flashcards","Notebook / Computador"];

function buildPrompt(ano, tema, duracao, nivel, recursos) {
  const temNotebook = recursos.includes("Notebook / Computador");
  const duracaoMin = duracao === "2 períodos (80 min)" ? "80 minutos" : "40 minutos";
  const recursosStr = recursos.join(", ");

  const efI = ["Pré Escola","1º Ano","2º Ano","3º Ano","4º Ano","5º Ano"].includes(ano);

  return `Você é um especialista pedagógico em Língua Inglesa da Rede Municipal de Vacaria/RS, com domínio profundo de:
- BNCC (Base Nacional Comum Curricular) — Componente: Língua Inglesa
- Referencial Curricular Gaúcho (BNCC + adaptações RS)
- DCOMVAC (Documento Curricular Orientador Municipal de Vacaria/RS)
- Sistema de Ensino Aprende Brasil (Grupo Positivo) — Componente Língua Inglesa

RESTRIÇÃO 1 — DISCIPLINA EXCLUSIVA:
Este plano é ESTRITAMENTE de LÍNGUA INGLESA.
Independente do tema "${tema}", estruture a aula como aula de Inglês.

RESTRIÇÃO 2 — IDIOMA DO PLANO:
O plano deve estar 100% em PORTUGUÊS BRASILEIRO.
Use inglês apenas para vocabulário-alvo, comandos e estruturas gramaticais ensinados.

RESTRIÇÃO 3 — BNCC (OBRIGATÓRIO, verbatim):
Use SOMENTE códigos e descrições EXATOS da BNCC oficial para Língua Inglesa.
NÃO parafraseie, NÃO invente códigos. Selecione 2 a 4 habilidades reais.
Padrões: EF06LIxx (6º), EF07LIxx (7º), EF08LIxx (8º), EF09LIxx (9º).

RESTRIÇÃO 4 — REFERENCIAL GAÚCHO:
Use sufixo RS quando houver adaptação gaúcha (ex: EF06LI01RS).

RESTRIÇÃO 5 — APRENDE BRASIL:
Indique Volume/Unidade do Sistema Aprende Brasil nas Referências.

RESTRIÇÃO 6 — BNCC NO ENSINO FUNDAMENTAL I:
${efI
  ? `Este plano é para ${ano}. A BNCC NÃO prevê códigos de Língua Inglesa para anos iniciais.
NUNCA invente códigos EFxxLIxx. Use o título "## Habilidades Trabalhadas" e descreva 2–4 competências em português inspiradas na BNCC, SEM códigos.`
  : `Este plano é para ${ano} (anos finais). Use códigos BNCC exatos de Língua Inglesa.`}

RESTRIÇÃO 7 — RECURSOS DISPONÍVEIS:
O professor tem acesso a: ${recursosStr}.
${temNotebook
  ? `OBRIGATÓRIO: O plano DEVE incluir atividades digitais específicas aproveitando o notebook/computador.
Sugira ferramentas gratuitas online (ex: Wordwall, Quizlet, Google Slides, YouTube, Kahoot, Duolingo for Schools, Padlet, Mentimeter) com links ou instruções de uso direto em sala.
Descreva passo a passo como o professor conduz a atividade digital.`
  : `Adapte todas as atividades para uso ${recursos.includes("Cards / Flashcards") ? "de cards e flashcards físicos" : "do quadro negro"}, sem dependência de tecnologia digital.`}

RESTRIÇÃO 8 — NÍVEL DA TURMA:
Nível: ${nivel}.
${nivel === "Básico" ? "Use vocabulário simples, muita repetição, suporte visual e instruções curtas." : ""}
${nivel === "Intermediário" ? "Equilibre atividades de produção e reconhecimento. Permita respostas mais elaboradas." : ""}
${nivel === "Avançado" ? "Proponha desafios de produção oral e escrita, discussões e autonomia na língua." : ""}

Crie o plano exatamente neste formato:

# Plano de Aula — Língua Inglesa
**Tema:** ${tema}
**Série:** ${ano} | **Duração:** ${duracaoMin} | **Nível:** ${nivel} | **Componente:** Língua Inglesa
**Recursos:** ${recursosStr}

${efI ? "## Habilidades Trabalhadas" : "## Habilidades BNCC Alinhadas"}
${efI
  ? "[Descreva 2–4 competências em português, SEM códigos, inspiradas na BNCC de Língua Inglesa]"
  : "[Liste 2–4 habilidades com código exato e descrição verbatim da BNCC]"}

## Objetivos de Aprendizagem
• [Objetivo 1]
• [Objetivo 2]
• [Objetivo 3 — opcional]

## Materiais Necessários
• [Liste apenas os materiais condizentes com os recursos disponíveis: ${recursosStr}]

## Estrutura da Aula (${duracaoMin})
${duracao === "2 períodos (80 min)"
  ? `### PERÍODO 1 (40 min)

### 1. Aquecimento — Warm Up (8–10 min)
[Descrição passo a passo]

### 2. Apresentação — Presentation (15 min)
[Introdução do conteúdo${temNotebook ? " com atividade digital" : ""}]

### 3. Prática Guiada — Guided Practice (15 min)
[Atividade de prática${temNotebook ? " usando ferramenta digital (indique qual e como)" : ""}]

### PERÍODO 2 (40 min)

### 4. Prática Livre — Free Practice (20 min)
[Atividade de produção${temNotebook ? " com recurso digital (indique qual e como)" : ""}]

### 5. Produção — Production (12 min)
[Atividade de produção final]

### 6. Fechamento — Wrap Up (8 min)
[Encerramento, recapitulação e avaliação informal]`
  : `### 1. Aquecimento — Warm Up (5–8 min)
[Descrição passo a passo]

### 2. Apresentação — Presentation (10–12 min)
[Introdução do conteúdo${temNotebook ? " com atividade digital (indique ferramenta e como usar)" : ""}]

### 3. Prática — Practice (12–15 min)
[Atividade de prática guiada${temNotebook ? " usando ferramenta digital (indique qual e como)" : ""}]

### 4. Produção — Production (5–8 min)
[Atividade de produção]

### 5. Fechamento — Wrap Up (3–5 min)
[Encerramento e recapitulação]`}

## Avaliação
[2–4 linhas com critérios observáveis adequados ao nível ${nivel}]

## Adaptação para Inclusão / Diversidade
[3–5 linhas com adaptações para NEE e realidade gaúcha]

## Referências e Recursos Complementares
[Aprende Brasil Volume/Unidade${temNotebook ? " + links de ferramentas digitais usadas no plano" : " + sugestões de materiais físicos"}]

Instruções finais: gere SOMENTE o plano, sem introduções extras.`;
}

async function callAPI(params) {
  const response = await fetch("/api/grok", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: "Você é um especialista pedagógico em Língua Inglesa da Rede Municipal de Vacaria/RS. Responda sempre em português brasileiro, com precisão técnica e linguagem acessível a professores.",
        },
        { role: "user", content: buildPrompt(params.ano, params.tema, params.duracao, params.nivel, params.recursos) },
      ],
      temperature: 0.65,
      max_tokens: 4000,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || data?.error || response.statusText);
  const text = data.choices?.[0]?.message?.content;
  if (!text || text.trim().length === 0) throw new Error("A API retornou uma resposta vazia.");
  return { text, provider: data._provider || "ia" };
}

function renderLines(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="md-h1">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="md-h2">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="md-h3">{line.slice(4)}</h3>;
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4)
      return <p key={i} className="md-bold">{line.slice(2, -2)}</p>;
    if (line.startsWith("• ") || line.startsWith("- ")) {
      const html = line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return <div key={i} className="md-li"><span className="md-bullet">▸</span><span dangerouslySetInnerHTML={{ __html: html }} /></div>;
    }
    if (line.startsWith("═")) return null;
    if (line.trim() === "---") return <hr key={i} className="md-hr" />;
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    const html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return <p key={i} className="md-p" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

function handlePrint(params) {
  const printEl = document.getElementById("plano-para-pdf");
  if (!printEl) return;
  const win = window.open("", "_blank", "width=900,height=700");
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Plano — ${params.tema} — ${params.ano}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Sans',sans-serif;font-size:11pt;color:#1e293b;background:#fff;padding:2cm 2.2cm;line-height:1.65}
.pdf-header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #d97706;padding-bottom:10px;margin-bottom:18px}
.pdf-title{font-size:22pt;font-weight:700;color:#b45309;letter-spacing:-1px}
.pdf-title span{color:#0e7490}
.pdf-sub{font-size:9pt;color:#78716c;text-align:right;line-height:1.5}
.md-h1{font-size:14pt;font-weight:700;color:#b45309;margin:16px 0 6px;padding-bottom:5px;border-bottom:1.5px solid #fde68a}
.md-h2{font-size:9pt;font-weight:700;color:#0e7490;text-transform:uppercase;letter-spacing:.07em;margin:14px 0 5px}
.md-h3{font-size:10pt;font-weight:700;color:#7c3aed;margin:10px 0 4px}
.md-bold{font-weight:700;color:#0f172a;margin:4px 0}
.md-p{margin:2px 0}
.md-li{display:flex;gap:8px;margin:2px 0;padding-left:4px}
.md-bullet{color:#d97706;flex-shrink:0}
.md-li strong{color:#92400e}
.md-hr{border:none;border-top:1px solid #e2e8f0;margin:10px 0}
.pdf-footer{margin-top:24px;padding-top:8px;border-top:1px solid #fde68a;font-size:8pt;color:#a8a29e;display:flex;justify-content:space-between}
@media print{body{padding:1.5cm 2cm}@page{margin:1.5cm 2cm}h2,h3{page-break-after:avoid}}
</style></head><body>
<div class="pdf-header">
  <div class="pdf-title">Vacar<span>IA</span></div>
  <div class="pdf-sub">Rede Municipal de Vacaria/RS<br/>Plano de Aula — Língua Inglesa</div>
</div>
${printEl.innerHTML}
<div class="pdf-footer">
  <span>VacarIA · Assistente Pedagógico para Professores de Inglês</span>
  <span>${new Date().toLocaleDateString("pt-BR")}</span>
</div>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

function handleWhatsApp(result) {
  const texto = encodeURIComponent(
    `📚 *Plano de Aula gerado pelo VacarIA*\n\n${result.slice(0, 1000)}...\n\n_Gerado em ${new Date().toLocaleDateString("pt-BR")}_`
  );
  window.open(`https://wa.me/?text=${texto}`, "_blank");
}

function handleShareLink(result, params) {
  const payload = btoa(encodeURIComponent(JSON.stringify({ result, params, date: new Date().toISOString() })));
  const url = `${window.location.origin}${window.location.pathname}?plano=${payload}`;
  navigator.clipboard.writeText(url);
  return url;
}

function CheckboxGroup({ label, options, value, onChange }) {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className="field">
      <label>{label}</label>
      <div className="checkbox-group">
        {options.map(opt => (
          <button key={opt} type="button"
            className={`chip${value.includes(opt) ? " chip-active" : ""}`}
            onClick={() => toggle(opt)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="radio-group">
        {options.map(opt => (
          <button key={opt} type="button"
            className={`chip${value === opt ? " chip-active" : ""}`}
            onClick={() => onChange(opt)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [ano, setAno] = useState("");
  const [tema, setTema] = useState("");
  const [duracao, setDuracao] = useState("1 período (40 min)");
  const [nivel, setNivel] = useState("Básico");
  const [recursos, setRecursos] = useState(["Quadro negro apenas"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [provider, setProvider] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleGenerate = async () => {
    if (!ano || !tema.trim()) { setError("Selecione o ano e digite o tema da aula."); return; }
    if (recursos.length === 0) { setError("Selecione pelo menos um recurso disponível."); return; }
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await callAPI({ ano, tema, duracao, nivel, recursos });
      setResult(res.text);
      setProvider(res.provider);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLink = () => {
    handleShareLink(result, { ano, tema, duracao, nivel, recursos });
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#fefce8;min-height:100vh}
        .app{min-height:100vh;background:#fefce8;background-image:radial-gradient(ellipse at 15% 0%,rgba(251,191,36,.18) 0%,transparent 45%),radial-gradient(ellipse at 85% 100%,rgba(14,116,144,.08) 0%,transparent 45%);display:flex;flex-direction:column;align-items:center;padding:40px 16px 60px;font-family:'IBM Plex Sans',sans-serif}
        .header{text-align:center;margin-bottom:40px}
        .logo-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(180,83,9,.08);border:1px solid rgba(180,83,9,.2);border-radius:100px;padding:6px 16px;margin-bottom:20px}
        .logo-dot{width:8px;height:8px;background:#d97706;border-radius:50%;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .logo-badge span{font-family:'Space Mono',monospace;font-size:11px;color:#92400e;letter-spacing:.1em;text-transform:uppercase}
        .title{font-family:'Space Mono',monospace;font-size:clamp(42px,8vw,72px);font-weight:700;color:#b45309;letter-spacing:-2px;line-height:1;margin-bottom:12px}
        .title span{color:#0e7490}
        .subtitle{font-size:15px;color:#78716c;max-width:420px;line-height:1.6}

        .card{width:100%;max-width:600px;background:#fff;border:1px solid #fde68a;border-radius:16px;padding:32px;box-shadow:0 4px 6px rgba(180,83,9,.04),0 10px 40px rgba(180,83,9,.08)}

        .field{margin-bottom:22px}
        .field label{display:block;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:#92400e;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}

        .select,.textarea{width:100%;background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;color:#1c1917;font-family:'IBM Plex Sans',sans-serif;font-size:15px;padding:12px 16px;outline:none;transition:border-color .2s,box-shadow .2s;appearance:none;-webkit-appearance:none}
        .select:focus,.textarea:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,.12)}
        .select-wrapper{position:relative}
        .select-wrapper::after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#a16207;pointer-events:none;font-size:12px}
        .textarea{resize:vertical;min-height:90px;line-height:1.6}
        .textarea::placeholder{color:#c4b59a}
        select option{background:#fffbeb;color:#1c1917}

        .radio-group,.checkbox-group{display:flex;flex-wrap:wrap;gap:8px}
        .chip{padding:8px 16px;border-radius:100px;border:1.5px solid #fde68a;background:#fffbeb;color:#78716c;font-family:'IBM Plex Sans',sans-serif;font-size:13px;cursor:pointer;transition:all .18s;white-space:nowrap}
        .chip:hover{border-color:#d97706;color:#92400e}
        .chip-active{background:#d97706;border-color:#d97706;color:#fff;font-weight:600}
        .chip-active:hover{background:#b45309;border-color:#b45309;color:#fff}

        .divider{border:none;border-top:1px solid #fde68a;margin:4px 0 20px}

        .btn{width:100%;padding:14px;background:linear-gradient(135deg,#d97706,#b45309);border:none;border-radius:10px;color:#fff;font-family:'Space Mono',monospace;font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(180,83,9,.3)}
        .btn:hover:not(:disabled){background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 6px 24px rgba(180,83,9,.4);transform:translateY(-1px)}
        .btn:disabled{opacity:.5;cursor:not-allowed;transform:none}

        .error-box{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;color:#b91c1c;font-size:14px;margin-top:16px}

        .result-card{width:100%;max-width:780px;background:#fff;border:1px solid #fde68a;border-radius:16px;margin-top:32px;overflow:hidden;box-shadow:0 4px 6px rgba(180,83,9,.04),0 10px 40px rgba(180,83,9,.08)}
        .result-header{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:#fffbeb;border-bottom:1px solid #fde68a;flex-wrap:wrap;gap:10px}
        .result-header-left{display:flex;align-items:center;gap:10px}
        .result-tag{font-family:'Space Mono',monospace;font-size:11px;color:#92400e;letter-spacing:.1em;text-transform:uppercase;font-weight:700}
        .provider-badge{background:rgba(14,116,144,.08);border:1px solid rgba(14,116,144,.2);border-radius:100px;padding:3px 10px;font-family:'Space Mono',monospace;font-size:10px;color:#0e7490}
        .result-actions{display:flex;gap:8px;flex-wrap:wrap}
        .action-btn{background:#fff;border:1.5px solid #fde68a;border-radius:8px;color:#92400e;font-family:'Space Mono',monospace;font-size:11px;padding:6px 13px;cursor:pointer;transition:all .2s;white-space:nowrap}
        .action-btn:hover{background:#fef3c7;border-color:#d97706}
        .action-btn.pdf{background:#b45309;border-color:#b45309;color:#fff}
        .action-btn.pdf:hover{background:#92400e;border-color:#92400e}
        .action-btn.whats{background:#16a34a;border-color:#16a34a;color:#fff}
        .action-btn.whats:hover{background:#15803d;border-color:#15803d}
        .action-btn.link{background:#0e7490;border-color:#0e7490;color:#fff}
        .action-btn.link:hover{background:#0c6476;border-color:#0c6476}

        .result-body{padding:28px 32px}
        .md-h1{font-size:20px;font-weight:800;color:#b45309;font-family:'Space Mono',monospace;margin:8px 0 12px;border-bottom:2px solid #fde68a;padding-bottom:8px}
        .md-h2{font-size:12px;font-weight:700;color:#0e7490;font-family:'Space Mono',monospace;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.08em}
        .md-h3{font-size:14px;font-weight:700;color:#7c3aed;font-family:'Space Mono',monospace;margin:16px 0 6px}
        .md-bold{font-weight:700;color:#0f172a;margin:4px 0}
        .md-li{display:flex;gap:10px;margin:3px 0;padding-left:4px}
        .md-bullet{color:#d97706;flex-shrink:0;margin-top:2px}
        .md-li strong{color:#92400e}
        .md-hr{border:none;border-top:1px solid #e2e8f0;margin:16px 0}
        .md-p{margin:2px 0;color:#1e293b;line-height:1.75;font-size:15px}

        .loading-box{display:flex;justify-content:center;padding:48px}
        .spinner{width:36px;height:36px;border:3px solid #fde68a;border-top-color:#d97706;border-radius:50%;animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        .footer{margin-top:48px;text-align:center;font-family:'Space Mono',monospace;font-size:11px;color:#d4c4a0;letter-spacing:.05em}

        @media(max-width:640px){
          .card{padding:24px 16px}
          .result-body{padding:20px 16px}
          .result-header{flex-direction:column;align-items:flex-start}
          .result-actions{width:100%}
          .action-btn{flex:1;text-align:center}
        }
      `}</style>

      <div className="app">
        <header className="header">
          <div className="logo-badge">
            <div className="logo-dot" />
            <span>Professores de Inglês · Vacaria/RS</span>
          </div>
          <div className="title">Vacar<span>IA</span></div>
          <p className="subtitle">Assistente pedagógico com IA para planejamento de aulas de Língua Inglesa</p>
        </header>

        <div className="card">

          {/* Ano */}
          <div className="field">
            <label>Ano / Série</label>
            <div className="select-wrapper">
              <select className="select" value={ano} onChange={e => setAno(e.target.value)}>
                <option value="">Selecione o ano...</option>
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Tema */}
          <div className="field">
            <label>Tema da Aula</label>
            <textarea className="textarea" value={tema} onChange={e => setTema(e.target.value)}
              placeholder="Ex: Greetings and Introductions, Verb To Be, Numbers 1–20, Colors..." rows={3} />
          </div>

          <hr className="divider" />

          {/* Duração */}
          <RadioGroup label="Duração" options={DURACOES} value={duracao} onChange={setDuracao} />

          {/* Nível */}
          <RadioGroup label="Nível da Turma" options={NIVEIS} value={nivel} onChange={setNivel} />

          {/* Recursos */}
          <CheckboxGroup label="Recursos Disponíveis" options={RECURSOS} value={recursos} onChange={setRecursos} />

          <hr className="divider" />

          <button className="btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Gerando..." : "✦ Gerar Plano de Aula"}
          </button>

          {error && <div className="error-box">⚠ {error}</div>}
        </div>

        {loading && (
          <div className="result-card">
            <div className="loading-box">
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                <div className="spinner" />
                <p style={{color:"#92400e",fontSize:14,fontFamily:"'Space Mono',monospace"}}>Gerando plano com IA...</p>
              </div>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="result-card">
            <div className="result-header">
              <div className="result-header-left">
                <span className="result-tag">Plano Gerado</span>
                {provider && (
                  <span className="provider-badge">
                    {provider === "groq" ? "Groq · LLaMA 3.3" : provider === "gemini" ? "Gemini · Fallback" : "IA"}
                  </span>
                )}
              </div>
              <div className="result-actions">
                <button className="action-btn" onClick={handleCopy}>{copied ? "✓ Copiado!" : "Copiar"}</button>
                <button className="action-btn link" onClick={handleLink}>{linkCopied ? "✓ Link copiado!" : "🔗 Compartilhar"}</button>
                <button className="action-btn whats" onClick={() => handleWhatsApp(result)}>WhatsApp</button>
                <button className="action-btn pdf" onClick={() => handlePrint({ ano, tema })}>↓ PDF</button>
              </div>
            </div>
            <div className="result-body">
              <div id="plano-para-pdf">{renderLines(result)}</div>
            </div>
          </div>
        )}

        <footer className="footer">VacarIA · Secretaria Municipal de Educação · Vacaria/RS</footer>
      </div>
    </>
  );
}
