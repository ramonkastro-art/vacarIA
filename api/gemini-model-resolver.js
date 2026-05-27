/**
 * Resolve automaticamente o melhor modelo Gemini disponível.
 * Consulta a API de modelos e retorna o mais recente compatível com generateContent.
 * Cache em memória por 1 hora para não chamar a cada requisição.
 */

let cachedModel = null
let cacheTime = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

// Preferências de modelo em ordem de prioridade (mais novo primeiro)
const MODEL_PRIORITY = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
]

function scoreModel(name) {
  // Retorna índice de prioridade (menor = melhor)
  for (let i = 0; i < MODEL_PRIORITY.length; i++) {
    if (name.includes(MODEL_PRIORITY[i])) return i
  }
  return 999
}

export async function getBestGeminiModel(apiKey) {
  const now = Date.now()

  // Retorna cache se ainda válido
  if (cachedModel && (now - cacheTime) < CACHE_TTL) {
    console.log(`[gemini-resolver] Cache hit: ${cachedModel}`)
    return cachedModel
  }

  try {
    console.log('[gemini-resolver] Consultando modelos disponíveis...')
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=50`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (!res.ok) {
      console.warn('[gemini-resolver] Falha ao listar modelos, usando fallback')
      return 'gemini-1.5-flash'
    }

    const data = await res.json()
    const models = (data.models || [])
      .filter(m =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        !m.name.includes('vision') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa')
      )
      .map(m => m.name.replace('models/', ''))

    console.log('[gemini-resolver] Modelos disponíveis:', models)

    // Ordena por prioridade e pega o melhor
    const sorted = models.sort((a, b) => scoreModel(a) - scoreModel(b))
    const best = sorted[0] || 'gemini-1.5-flash'

    cachedModel = best
    cacheTime = now
    console.log(`[gemini-resolver] Melhor modelo selecionado: ${best}`)
    return best

  } catch (e) {
    console.warn('[gemini-resolver] Erro ao resolver modelo:', e.message)
    return 'gemini-1.5-flash'
  }
}
