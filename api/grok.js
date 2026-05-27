import generateWithGemini from '../src/lib/gemini-generate-wrapper.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }

  const messages = body.messages || []

  // helper: fetch with timeout
  async function fetchWithTimeout(url, opts = {}, timeout = 5000) {
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

  // Build combined prompt text from messages
  const systemText = messages.filter(m => m.role === 'system').map(m => m.content).join('
')
  const userText = messages.filter(m => m.role === 'user').map(m => m.content).join('
')
  const promptText = (systemText ? systemText + "

" : "") + userText

  // 1) Try Groq first (fast, preferred for lesson plans)
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
          max_tokens: body.max_tokens ?? 8000,
        }),
      }, 5000)

      const data = await groqRes.json().catch(() => null)
      if (groqRes.ok && data) {
        return res.status(200).json({ ...data, _provider: 'groq' })
      }

      const status = groqRes.status
      // non-transient errors -> return to client
      if (status && status !== 429 && status !== 503 && status !== 402) {
        return res.status(status || 500).json(data || { error: 'Groq erro desconhecido' })
      }

      console.warn('[grok] Groq unavailable or transient error, falling back to Gemini', status)
    } catch (e) {
      console.warn('[grok] Groq network/error:', e && e.message)
      // fallthrough to Gemini
    }
  }

  // 2) Gemini fallback
  if (geminiKey) {
    try {
      // Use the wrapper which resolves model, handles timeouts/retries and large tokens
      const maxOutputTokens = body.max_tokens || 8192
      const temp = body.temperature ?? 0.65

      const result = await generateWithGemini(geminiKey, promptText, { maxOutputTokens, temperature: temp })
      if (result && (result.text || result.raw)) {
        const text = result.text || (result.raw && JSON.stringify(result.raw)) || ''
        return res.status(200).json({
          _provider: 'gemini-fallback',
          choices: [{ message: { role: 'assistant', content: text } }],
          raw: result.raw || null,
        })
      }

      return res.status(500).json({ error: 'Gemini returned no content', raw: result && result.raw })
    } catch (e) {
      console.error('[grok] Gemini error:', e && e.message)
      return res.status(500).json({ error: `Gemini failed: ${e && e.message}` })
    }
  }

  return res.status(500).json({ error: 'No API key available (Groq or Gemini).' })
}
