export default async function handler(req, res) {
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

  const diagnostico = []

  // ── 1. Gemini (prioritário com Autodescoberta) ─────────────────────
  if (geminiKey) {
    try {
      console.log('[avaliacao] Buscando modelos liberados na API do Google...')
      
      // Consulta a API para saber O QUE está disponível para esta chave específica
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`)
      const listData = await listRes.json()

      let geminiModels = []

      if (listData.models) {
        // Filtra modelos que suportam geração de texto e limpa o prefixo 'models/'
        geminiModels = listData.models
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => m.name.replace('models/', ''))
          .filter(name => name.includes('gemini') && !name.includes('vision') && !name.includes('embedding'));

        // Prioriza as versões "flash" colocando-as no topo da lista
        geminiModels.sort((a, b) => {
          if (a.includes('flash') && !b.includes('flash')) return -1;
          if (!a.includes('flash') && b.includes('flash')) return 1;
          return 0;
        });

        console.log(`[avaliacao] Modelos compatíveis encontrados: ${geminiModels.slice(0, 5).join(', ')}...`)
      }

      if (geminiModels.length === 0) {
        diagnostico.push('Nenhum modelo compatível retornado pela API listModels.')
      }

      // Tenta gerar a resposta usando até 3 modelos disponíveis
      for (const model of geminiModels.slice(0, 3)) {
        try {
          console.log(`[avaliacao] Tentando Gemini: ${model}`)

          // Usamos v1beta que é o padrão da maioria das contas
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`

          const promptFinal = sysMsg && sysMsg.trim().length > 0 
            ? `[INSTRUÇÕES DE SISTEMA - SIGA RIGOROSAMENTE]:\n${sysMsg}\n\n[REQUISIÇÃO DO USUÁRIO]:\n${userMsg}` 
            : userMsg;

          const payload = {
            contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
            generationConfig: {
              temperature: body.temperature ?? 0.3,
              maxOutputTokens: body.max_tokens ?? 4000,
            },
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

          if (status === 403) break; // Para se a chave for inválida

        } catch (e) {
          console.warn(`[avaliacao] Gemini ${model} erro de rede: ${e.message}`)
          diagnostico.push(`${model}: erro de rede — ${e.message}`)
        }
      }
    } catch (error) {
      console.error('[avaliacao] Erro fatal ao consultar lista de modelos:', error)
      diagnostico.push(`Erro ao listar modelos: ${error.message}`)
    }
  } else {
    diagnostico.push('GEMINI_API_KEY ausente')
  }

  // ── 2. Fallback: Groq (só chega aqui se tudo falhar) ──
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