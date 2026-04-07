export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const geminiKey = process.env.GEMINI_API_KEY
  const groqKey   = process.env.GROQ_API_KEY

  let body = req.body
  if (typeof body === 'string') { 
    try { body = JSON.parse(body) } catch { body = {} } 
  }

  const messages = body.messages || []
  const userMsg  = messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
  const sysMsg   = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')

  // Lista atualizada com as versões experimentais como segurança
  const geminiModels = [
    'gemini-1.5-flash',       // Rápido, estável e liberado para todas as contas
    'gemini-1.5-flash-8b',    // Backup super rápido
    'gemini-1.5-pro',         // Backup mais robusto e inteligente
    // 'gemini-2.0-flash'     <-- Removido até que o Google libere para sua conta
  ];

  const diagnostico = []

  // ── 1. Gemini (prioritário) ─────────────────────────────────────
  if (geminiKey) {
    for (const model of geminiModels) {
      try {
        console.log(`[avaliacao] Tentando Gemini: ${model}`)

        // Usando v1beta que é mais resiliente para modelos novos/exp
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`

        const payload = {
          contents: [{ role: 'user', parts: [{ text: userMsg }] }],
          generationConfig: {
            temperature: body.temperature ?? 0.3,
            maxOutputTokens: body.max_tokens ?? 4000,
          },
        }

        // Adiciona instrução de sistema apenas se houver conteúdo
        if (sysMsg && sysMsg.trim().length > 0) {
          payload.system_instruction = { parts: [{ text: sysMsg }] }
        }

        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await geminiRes.json()
        const status = geminiRes.status

        if (geminiRes.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          
          // Reduzi a trava para 5 caracteres para não ignorar respostas válidas/curtas
          if (text.trim().length > 5) {
            console.log(`[avaliacao] Gemini OK: ${model}`)
            return res.status(200).json({
              _provider: `gemini`,
              _model: model,
              choices: [{ message: { role: 'assistant', content: text } }],
            })
          }
          diagnostico.push(`${model}: resposta insuficiente ou vazia`)
          continue 
        }

        const errMsg = data?.error?.message || data?.error?.status || `HTTP ${status}`
        console.warn(`[avaliacao] Gemini ${model} erro ${status}: ${errMsg}`)
        diagnostico.push(`${model}: ${status} — ${errMsg}`)

        if (status === 403) {
          console.error('[avaliacao] Gemini 403 — verifique se a API Key é válida')
          break // Para o loop se a chave estiver errada
        }
        
        continue // Tenta o próximo modelo da lista

      } catch (e) {
        console.warn(`[avaliacao] Gemini ${model} erro de rede: ${e.message}`)
        diagnostico.push(`${model}: erro de rede — ${e.message}`)
        continue
      }
    }
  } else {
    diagnostico.push('GEMINI_API_KEY ausente')
  }

  // ── 2. Fallback: Groq (só chega aqui se todos os modelos Gemini falharem) ──
  console.log(`[avaliacao] Iniciando Fallback Groq. Erros: ${diagnostico.join(' | ')}`)

  if (groqKey) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: body.temperature ?? 0.3,
          max_tokens: body.max_tokens ?? 4000,
        }),
      })

      const groqData = await groqRes.json()
      if (groqRes.ok) {
        return res.status(200).json({
          ...groqData,
          _provider: 'groq-fallback',
          _gemini_diagnostico: diagnostico,
        })
      }
      return res.status(groqRes.status).json({ error: 'Groq falhou', details: groqData, _gemini_diagnostico: diagnostico })
    } catch (e) {
      return res.status(500).json({ error: `Erro fatal no Fallback: ${e.message}`, _gemini_diagnostico: diagnostico })
    }
  }

  return res.status(500).json({ error: 'Nenhuma API respondeu.', _gemini_diagnostico: diagnostico })
}