import { getBestGeminiModel } from './gemini-model-resolver.js'

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

  // ── 1. Gemini (principal para avaliações — modelo resolvido automaticamente) ──
  if (geminiKey) {
    try {
      const model = await getBestGeminiModel(geminiKey)
      console.log(`[avaliacao] Usando Gemini: ${model}`)

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

      if (geminiRes.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text.trim().length > 100) {
          console.log(`[avaliacao] Gemini OK: ${model}`)
          return res.status(200).json({
            _provider: 'gemini',
            _model: model,
            choices: [{ message: { role: 'assistant', content: text } }],
          })
        }
      }

      const status = geminiRes.status
      const errMsg = data?.error?.message || `HTTP ${status}`
      console.warn(`[avaliacao] Gemini ${model} erro ${status}: ${errMsg}`)

      if (status === 403) {
        return res.status(403).json({ error: `Gemini 403: ${errMsg}` })
      }
    } catch (e) {
      console.warn('[avaliacao] Gemini erro de rede:', e.message)
    }
  }

  // ── 2. Fallback: Groq ──────────────────────────────────────────
  if (groqKey) {
    try {
      console.log('[avaliacao] Usando Groq como fallback')
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
      if (groqRes.ok) return res.status(200).json({ ...data, _provider: 'groq-fallback' })
      return res.status(groqRes.status).json(data)
    } catch (e) {
      console.error('[avaliacao] Groq erro:', e.message)
      return res.status(500).json({ error: `Groq falhou: ${e.message}` })
    }
  }

  return res.status(500).json({ error: 'Nenhuma API disponível.' })
}
