import React from "react";

const produtos = [
  { emoji:"📘", label:"E-book - A Arte de Cativar Alunos", sub:"Ramon Castro (Amazon)", url:"https://www.amazon.com.br/Arte-Cativar-Alunos-Confiança-Desconhecido-ebook/dp/B0GWSBTRKX/" },
  { emoji:"💻", label:"Notebook ASUS VivoBook i5", sub:"Indicação pessoal", url:"https://meli.la/1rfrpns" },
  { emoji:"📖", label:"Dicionário de Inglês", sub:"Referência do professor", url:"https://meli.la/1bgNUVv" },
  { emoji:"📱", label:"Smartphone recomendado", sub:"Ótimo para aulas e gravação", url:"https://meli.la/2DxSGzh" },
  { emoji:"🎧", label:"Fone de Ouvido", sub:"Para aulas online", url:"https://meli.la/15ZyCAH" },
  { emoji:"🎤", label:"Microfone + Amplificador", sub:"Salas até 30 alunos", url:"https://meli.la/1hZQMnn" },
];

export default function Lojinha() {
  return (
    <div style={{padding:24, maxWidth:1100, margin:"0 auto"}}>
      <h1 style={{color:"#b45309", marginBottom:6}}>🛒 Lojinha do Professor Ramon</h1>
      <p style={{color:"#78350f", marginBottom:18}}>
        Produtos que uso e recomendo. Alguns links são afiliados — se você comprar, eu recebo uma pequena comissão sem custo adicional.
      </p>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",
        gap:14
      }}>
        {produtos.map(p => (
          <a
            key={p.label}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              padding:16, background:"#fffaf0", border:"1px solid #fde68a",
              borderRadius:12, textDecoration:"none", color:"#78350f",
              transition:"transform .12s, box-shadow .12s", textAlign:"center"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 8px 22px rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
          >
            <div style={{fontSize:"1.8rem"}}>{p.emoji}</div>
            <div style={{fontWeight:800, marginTop:8}}>{p.label}</div>
            <div style={{fontSize:12, opacity:0.8, marginTop:6}}>{p.sub}</div>
            <div style={{
              marginTop:10, padding:"6px 10px", fontSize:12, color:"#fff",
              background:"#b45309", borderRadius:8, fontWeight:700
            }}>Ver produto →</div>
          </a>
        ))}
      </div>

      <div style={{marginTop:22, fontSize:12, color:"#6b7280"}}>
        <strong>Aviso:</strong> alguns links são de afiliado. Isso ajuda a manter o VacarIA — obrigado pelo apoio!
      </div>
    </div>
  );
}