// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// ⚠️ SUBSTITUA PELOS SEUS VALORES
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-publica-aqui';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📝 Função para registrar acesso
export async function logAccess(pageSlug) {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();

    const { data, error } = await supabase
      .from('access_logs')
      .insert([
        {
          ip_address: ip,
          page_path: pageSlug || window.location.pathname,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          browser_name: getBrowserName(),
          ip_location: 'N/A', // Será atualizado depois se houver API de geolocalização
        }
      ]);

    if (error) console.error('Erro ao registrar acesso:', error);
    return data;
  } catch (err) {
    console.error('Erro:', err);
  }
}

// 📝 Função para registrar interação
export async function logInteraction(featureUsed, interactionType, metadata = {}) {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();

    const { data, error } = await supabase
      .from('interaction_logs')
      .insert([
        {
          ip_address: ip,
          interaction_type: interactionType,
          feature_used: featureUsed,
          prompt_text: metadata.prompt || null,
          response_summary: metadata.summary || null,
          duration_ms: metadata.duration || null,
          success: metadata.success !== false,
          error_message: metadata.error || null,
        }
      ]);

    if (error) console.error('Erro ao registrar interação:', error);
    return data;
  } catch (err) {
    console.error('Erro:', err);
  }
}

// 📝 Função auxiliar para detectar tipo de dispositivo
function getDeviceType() {
  const userAgent = navigator.userAgent;
  if (/mobile|android|iphone|ipod/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

// 📝 Função auxiliar para detectar navegador
function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
  if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
  if (userAgent.indexOf('Safari') > -1) return 'Safari';
  if (userAgent.indexOf('Edge') > -1) return 'Edge';
  return 'Unknown';
}

// 📊 Função para buscar estatísticas (admin)
export async function getAccessStats() {
  try {
    const { data, error } = await supabase
      .rpc('get_access_stats');
    if (error) throw error;
    return data?.[0] || null;
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return null;
  }
}

export async function getInteractionStats() {
  try {
    const { data, error } = await supabase
      .rpc('get_interaction_stats');
    if (error) throw error;
    return data?.[0] || null;
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return null;
  }
}

export async function getTopFeatures() {
  try {
    const { data, error } = await supabase
      .rpc('get_top_features');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar features:', err);
    return [];
  }
}