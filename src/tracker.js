import { supabase } from './supabase'

// Detecta tipo de dispositivo
function getDeviceType() {
  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile'
  return 'desktop'
}

// Detecta nome do browser
function getBrowserName() {
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  return 'Unknown'
}

// Busca IP e localização
async function getIPInfo() {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    return {
      ip: data.ip || 'unknown',
      location: `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`.trim()
    }
  } catch {
    return { ip: 'unknown', location: 'unknown' }
  }
}

// Registra acesso à página
export async function trackPageAccess() {
  try {
    const { ip, location } = await getIPInfo()
    await supabase.from('access_logs').insert({
      ip_address: ip,
      ip_location: location,
      page_path: window.location.pathname,
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
      browser_name: getBrowserName(),
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Erro ao registrar acesso:', err)
  }
}

// Registra interação do usuário
export async function trackInteraction({ type, prompt, responseSummary, feature, durationMs, success, errorMessage }) {
  try {
    const { ip } = await getIPInfo()
    await supabase.from('interaction_logs').insert({
      ip_address: ip,
      interaction_type: type,
      prompt_text: prompt || null,
      response_summary: responseSummary || null,
      feature_used: feature || null,
      duration_ms: durationMs || null,
      success: success ?? true,
      error_message: errorMessage || null,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Erro ao registrar interação:', err)
  }
}