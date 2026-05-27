
// src/lib/gemini-model-resolver.js
let cachedModel = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

const MODEL_PRIORITY = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
];

const DEFAULT_FALLBACK = "gemini-1.5-flash";
const FETCH_TIMEOUT_MS = 3000; // timeout para listar modelos (ajustável)
const MAX_RETRIES = 2;

function scoreModel(name) {
  for (let i = 0; i < MODEL_PRIORITY.length; i++) {
    if (name.includes(MODEL_PRIORITY[i])) return i;
  }
  return 999;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url, opts = {}, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      ...opts,
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function getBestGeminiModel(apiKey) {
  const now = Date.now();

  // Override via ENV (for debugging/ops)
  try {
    if (typeof process !== 'undefined' && process.env && (process.env.GEMINI_MODEL || process.env.FORCE_GEMINI_MODEL)) {
      const forced = process.env.GEMINI_MODEL || process.env.FORCE_GEMINI_MODEL;
      console.log(`[gemini-resolver] GEMINI_MODEL override active: ${forced}`);
      cachedModel = forced;
      cacheTime = now;
      return forced;
    }
  } catch (e) {
    // ignore in browser environments
  }

  // Cache
  if (cachedModel && now - cacheTime < CACHE_TTL) {
    console.log(`[gemini-resolver] Cache hit: ${cachedModel}`);
    return cachedModel;
  }

  if (!apiKey) {
    console.warn('[gemini-resolver] Nenhuma API key fornecida - usando fallback');
    cachedModel = DEFAULT_FALLBACK;
    cacheTime = now;
    return cachedModel;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=50`;
  let lastErr = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = Math.min(1000 * attempt, 3000);
        console.log(`[gemini-resolver] Retry #${attempt} after ${backoff}ms`);
        await sleep(backoff);
      }

      console.log('[gemini-resolver] Consultando modelos disponíveis...');
      const res = await fetchWithTimeout(url, { headers: { 'Content-Type': 'application/json' } }, FETCH_TIMEOUT_MS);

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        console.warn(`[gemini-resolver] Lista modelos status ${res.status} - ${res.statusText} - body:${bodyText}`);
        if (res.status === 401 || res.status === 403) {
          console.warn('[gemini-resolver] Possível problema de API key (401/403). Verifique restrições ou permissões da chave.');
          break;
        }
        lastErr = new Error(`models list failed ${res.status}`);
        continue;
      }

      const data = await res.json();
      const models = (data.models || [])
        .filter(m =>
          m.supportedGenerationMethods?.includes('generateContent') &&
          !m.name.includes('vision') &&
          !m.name.includes('embedding') &&
          !m.name.includes('aqa')
        )
        .map(m => m.name.replace('models/', ''));

      console.log('[gemini-resolver] Modelos disponíveis:', models);

      const candidates = models.length ? models : MODEL_PRIORITY.slice();
      const sorted = candidates.sort((a, b) => scoreModel(a) - scoreModel(b));
      const best = sorted[0] || DEFAULT_FALLBACK;

      cachedModel = best;
      cacheTime = Date.now();
      console.log(`[gemini-resolver] Melhor modelo selecionado: ${best}`);
      return best;
    } catch (err) {
      lastErr = err;
      console.warn(`[gemini-resolver] Erro ao consultar modelos (attempt ${attempt}): ${err && err.message}`);
    }
  }

  console.warn(`[gemini-resolver] Usando fallback local (${DEFAULT_FALLBACK}) após erros: ${lastErr && lastErr.message}`);
  cachedModel = DEFAULT_FALLBACK;
  cacheTime = Date.now();
  return cachedModel;
}
