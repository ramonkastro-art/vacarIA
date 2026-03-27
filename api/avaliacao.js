export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const geminiKey = process.env.GEMINI_API_KEY
  const groqKey   = process.env.GROQ_API_KEY

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const messages = body.messages || []
  const userMsg  = messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
  const sysMsg   = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')

  const geminiModels = [
    'gemini-2.5-flash-preview-05-20',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ]

  // Diagnóstico — acumula erros para retornar se tudo falhar
  const diagnostico = []

  // ── 1. Gemini (prioritário) ─────────────────────────────────────
  if (geminiKey) {
    for (const model of geminiModels) {
      try {
        console.log(`[avaliacao] Tentando Gemini: ${model}`)

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: sysMsg }] },
              contents: [{ role: 'user', parts: [{ text: userMsg }] }],
              generationConfig: {
                temperature: body.temperature ?? 0.3,
                maxOutputTokens: body.max_tokens ?? 4000,
              },
            }),
          }
        )

        const data = await geminiRes.json()
        const status = geminiRes.status

        if (geminiRes.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (text.trim().length > 100) {
            console.log(`[avaliacao] Gemini OK: ${model}`)
            return res.status(200).json({
              _provider: `gemini`,
              _model: model,
              choices: [{ message: { role: 'assistant', content: text } }],
            })
          }
          diagnostico.push(`${model}: resposta vazia`)
          continue // tenta próximo modelo
        }

        const errMsg = data?.error?.message || data?.error?.status || `HTTP ${status}`
        console.warn(`[avaliacao] Gemini ${model} erro ${status}: ${errMsg}`)
        diagnostico.push(`${model}: ${status} — ${errMsg}`)

        // 404/400 = modelo não existe → tenta próximo
        // 403 = chave inválida → não adianta tentar outros modelos
        // 429 = rate limit → tenta próximo modelo
        if (status === 403) {
          console.error('[avaliacao] Gemini 403 — chave inválida ou sem permissão')
          break
        }
        // Para qualquer outro erro, tenta o próximo modelo
        continue

      } catch (e) {
        console.warn(`[avaliacao] Gemini ${model} erro de rede: ${e.message}`)
        diagnostico.push(`${model}: network error — ${e.message}`)
        continue
      }
    }
  } else {
    diagnostico.push('GEMINI_API_KEY não configurada no Vercel')
    console.error('[avaliacao] GEMINI_API_KEY não encontrada nas env vars!')
  }

  // ── 2. Fallback: Groq ──────────────────────────────────────────
  console.log(`[avaliacao] Usando Groq. Diagnóstico Gemini: ${diagnostico.join(' | ')}`)

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

      const data = await groqRes.json()
      if (groqRes.ok) {
        return res.status(200).json({
          ...data,
          _provider: 'groq-fallback',
          _gemini_diagnostico: diagnostico,
        })
      }
      return res.status(groqRes.status).json(data)
    } catch (e) {
      console.error('[avaliacao] Groq erro:', e.message)
      return res.status(500).json({ error: `Groq falhou: ${e.message}`, _gemini_diagnostico: diagnostico })
    }
  }

  return res.status(500).json({ error: 'Nenhuma API disponível.', _gemini_diagnostico: diagnostico })
}
