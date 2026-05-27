import { getBestGeminiModel } from './gemini-model-resolver.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const groqKey   = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const messages = body.messages || []

  async function fetchWithTimeout(url, opts = {}, timeout = 25000) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const r = await fetch(url, { signal: controller.signal, ...opts })
      clearTimeout(id)
      return r
    } catch (err) {
      clearTimeout(id)
      throw err
    }
  }

  // ── 1. Groq (principal para planos de aula) ────────────────────
  if (groqKey) {
    try {
      const groqRes = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: body.temperature ?? 0.65,
          max_tokens: body.max_tokens ?? 4000,
        }),
      }, 25000)

      const data = await groqRes.json()
      if (groqRes.ok) return res.status(200).json({ ...data, _provider: 'groq' })

      const status = groqRes.status
      if (status !== 429 && status !== 503 && status !== 402) {
        return res.status(status).json(data)
      }
      console.warn('[grok] Groq indisponível, tentando Gemini...', status)
    } catch (e) {
      console.warn('[grok] Groq erro:', e.message)
    }
  }

  // ── 2. Fallback: Gemini (modelo resolvido automaticamente) ──────
  if (geminiKey) {
    try {
      const model = await getBestGeminiModel(geminiKey)
      console.log(`[grok] Gemini fallback: ${model}`)

      const userMsg = messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
      const sysMsg  = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')

      const geminiRes = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sysMsg }] },
            contents: [{ role: 'user', parts: [{ text: userMsg }] }],
            generationConfig: {
              temperature: body.temperature ?? 0.65,
              maxOutputTokens: body.max_tokens ?? 4000,
            },
          }),
        }, 30000)

      const data = await geminiRes.json()
      if (!geminiRes.ok) {
        return res.status(geminiRes.status).json({ error: data?.error?.message || 'Erro no Gemini' })
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      return res.status(200).json({
        _provider: `gemini-${model}`,
        choices: [{ message: { role: 'assistant', content: text } }],
      })
    } catch (e) {
      console.error('[grok] Gemini erro:', e.message)
      return res.status(500).json({ error: `Gemini falhou: ${e.message}` })
    }
  }

  return res.status(500).json({ error: 'Nenhuma API disponível.' })
}
