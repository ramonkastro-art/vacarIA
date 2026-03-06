export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const messages = body.messages || []

  // ── 1. Tenta GROQ ──────────────────────────────────────────────
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
          temperature: body.temperature ?? 0.65,
          max_tokens: body.max_tokens ?? 3000,
        }),
      })

      const data = await groqRes.json()

      if (groqRes.ok) {
        return res.status(200).json({ ...data, _provider: 'groq' })
      }

      // Rate limit ou quota → tenta fallback
      const status = groqRes.status
      if (status !== 429 && status !== 503 && status !== 402) {
        return res.status(status).json(data)
      }

      console.warn('Groq indisponível, tentando Gemini...', status)
    } catch (e) {
      console.warn('Groq erro de rede:', e.message)
    }
  }

  // ── 2. Fallback: Gemini ─────────────────────────────────────────
  if (geminiKey) {
    try {
      // Extrai o conteúdo do usuário para enviar ao Gemini
      const userMsg = messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
      const sysMsg = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sysMsg }] },
            contents: [{ role: 'user', parts: [{ text: userMsg }] }],
            generationConfig: {
              temperature: body.temperature ?? 0.65,
              maxOutputTokens: body.max_tokens ?? 3000,
            },
          }),
        }
      )

      const data = await geminiRes.json()

      if (!geminiRes.ok) {
        console.error('Gemini erro:', JSON.stringify(data))
        return res.status(geminiRes.status).json({ error: data?.error?.message || 'Erro no Gemini' })
      }

      // Normaliza resposta no formato OpenAI para o frontend não precisar mudar
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      return res.status(200).json({
        _provider: 'gemini',
        choices: [{ message: { role: 'assistant', content: text } }],
      })
    } catch (e) {
      console.error('Gemini erro de rede:', e.message)
      return res.status(500).json({ error: `Gemini falhou: ${e.message}` })
    }
  }

  return res.status(500).json({ error: 'Nenhuma API disponível. Verifique as variáveis de ambiente.' })
}
