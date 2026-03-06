export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }

  try {
    const xaiRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await xaiRes.json()

    if (!xaiRes.ok) {
      console.error('xAI error:', JSON.stringify(data))
      return res.status(xaiRes.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('Fetch error:', error.message)
    return res.status(500).json({ error: `Erro ao contatar a API Grok: ${error.message}` })
  }
}
