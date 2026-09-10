import { supabase } from "./supabase";

const PROJECT = "vacaria";

const VISITOR_STORAGE_KEY = "vacaria_analytics_visitor_id";
const SESSION_STORAGE_KEY = "vacaria_analytics_session_id";
const SESSION_STARTED_KEY = "vacaria_analytics_session_started";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

let cachedIpInfo = null;
let ipInfoPromise = null;


/* ============================================================
   UTILITÁRIOS
   ============================================================ */

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 12)
  );
}


function getVisitorId() {
  try {
    let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);

    if (!visitorId) {
      visitorId = generateId();
      localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    }

    return visitorId;
  } catch {
    return generateId();
  }
}


function getCurrentPage() {
  if (typeof window === "undefined") {
    return "/";
  }

  return (
    window.location.pathname +
    window.location.search
  );
}


function getReferrer() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.referrer || null;
}


/* ============================================================
   DISPOSITIVO
   ============================================================ */

function detectDeviceType() {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet|playbook|silk/.test(userAgent)) {
    return "tablet";
  }

  if (
    /mobile|iphone|ipod|android.*mobile|windows phone/.test(
      userAgent
    )
  ) {
    return "mobile";
  }

  return "desktop";
}


/* ============================================================
   NAVEGADOR
   ============================================================ */

function detectBrowserName() {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const userAgent = navigator.userAgent;

  if (/edg/i.test(userAgent)) {
    return "Edge";
  }

  if (/opr|opera/i.test(userAgent)) {
    return "Opera";
  }

  if (/chrome|crios/i.test(userAgent)) {
    return "Chrome";
  }

  if (/firefox|fxios/i.test(userAgent)) {
    return "Firefox";
  }

  if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
    return "Safari";
  }

  if (/msie|trident/i.test(userAgent)) {
    return "Internet Explorer";
  }

  return "Outro";
}


/* ============================================================
   IP / LOCALIZAÇÃO
   ============================================================ */

async function getIpInfo() {
  if (cachedIpInfo) {
    return cachedIpInfo;
  }

  if (ipInfoPromise) {
    return ipInfoPromise;
  }

  ipInfoPromise = fetch("https://ipapi.co/json/", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Falha ao consultar localização do IP.");
      }

      return response.json();
    })
    .then((data) => {
      cachedIpInfo = {
        ip: data?.ip ?? null,
        city: data?.city ?? null,
        region: data?.region ?? null,
        country: data?.country_name ?? data?.country ?? null,
      };

      return cachedIpInfo;
    })
    .catch(() => {
      cachedIpInfo = {
        ip: null,
        city: null,
        region: null,
        country: null,
      };

      return cachedIpInfo;
    })
    .finally(() => {
      ipInfoPromise = null;
    });

  return ipInfoPromise;
}


/* ============================================================
   SESSÃO
   ============================================================ */

function getSessionId() {
  if (typeof sessionStorage === "undefined") {
    return generateId();
  }

  let sessionId = sessionStorage.getItem(
    SESSION_STORAGE_KEY
  );

  let sessionStarted = Number(
    sessionStorage.getItem(SESSION_STARTED_KEY) || 0
  );

  const now = Date.now();

  const sessionExpired =
    !sessionId ||
    !sessionStarted ||
    now - sessionStarted > SESSION_TIMEOUT_MS;

  if (sessionExpired) {
    sessionId = generateId();
    sessionStarted = now;

    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      sessionId
    );

    sessionStorage.setItem(
      SESSION_STARTED_KEY,
      String(sessionStarted)
    );
  }

  return sessionId;
}


/* ============================================================
   VISITANTE
   ============================================================ */

async function getOrCreateVisitor() {
  const visitorId = getVisitorId();

  const ipInfo = await getIpInfo();

  const deviceType = detectDeviceType();
  const browserName = detectBrowserName();

  const { data, error } = await supabase.rpc(
    "analytics_get_or_create_visitor",
    {
      p_visitor_id: visitorId,
      p_ip: ipInfo.ip,
      p_city: ipInfo.city,
      p_region: ipInfo.region,
      p_country: ipInfo.country,
      p_device_type: deviceType,
      p_browser_name: browserName,
    }
  );

  if (error) {
    console.error(
      "[Analytics] Erro ao registrar visitante:",
      error
    );

    return null;
  }

  return data;
}


/* ============================================================
   SESSÃO NO BANCO
   ============================================================ */

async function getOrCreateSession({
  visitorDbId,
  isPageView = false,
}) {
  const sessionId = getSessionId();

  const pagePath = getCurrentPage();
  const referrer = getReferrer();

  const deviceType = detectDeviceType();
  const browserName = detectBrowserName();

  const { data, error } = await supabase.rpc(
    "analytics_get_or_create_session",
    {
      p_session_id: sessionId,
      p_visitor_db_id: visitorDbId,
      p_project: PROJECT,
      p_page_path: pagePath,
      p_referrer: referrer,
      p_device_type: deviceType,
      p_browser_name: browserName,
      p_is_page_view: isPageView,
    }
  );

  if (error) {
    console.error(
      "[Analytics] Erro ao registrar sessão:",
      error
    );

    return null;
  }

  return data;
}


/* ============================================================
   EVENTO GENÉRICO
   ============================================================ */

export async function trackEvent({
  eventName,
  featureUsed = null,
  metadata = {},
  durationMs = null,
  success = null,
  pagePath = null,
}) {
  try {
    const visitorDbId = await getOrCreateVisitor();

    if (!visitorDbId) {
      return;
    }

    /*
     * Qualquer evento que não seja page_view é tratado como
     * evento/interação da sessão.
     */
    const isPageView = eventName === "page_view";

    const sessionDbId = await getOrCreateSession({
      visitorDbId,
      isPageView,
    });

    if (!sessionDbId) {
      return;
    }

    const finalPagePath =
      pagePath || getCurrentPage();

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        visitor_id: visitorDbId,
        session_id: sessionDbId,
        project: PROJECT,
        event_name: eventName,
        page_path: finalPagePath,
        feature_used: featureUsed,
        metadata,
        duration_ms: durationMs,
        success,
      });

    if (error) {
      console.error(
        "[Analytics] Erro ao registrar evento:",
        error
      );
    }
  } catch (error) {
    console.error(
      "[Analytics] Erro inesperado:",
      error
    );
  }
}


/* ============================================================
   ACESSO / PAGE VIEW
   ============================================================ */

export async function trackPageAccess() {
  await trackEvent({
    eventName: "page_view",
    pagePath: getCurrentPage(),
    metadata: {
      referrer: getReferrer(),
    },
    success: null,
  });
}


/* ============================================================
   INTERAÇÕES
   ============================================================ */

export async function trackInteraction({
  type,
  featureUsed = null,
  durationMs = null,
  success = null,
  prompt = null,
  response = null,
  error = null,
  metadata = {},
}) {
  let eventName = "interaction";

  if (success === false) {
    eventName = "generation_error";
  } else if (type === "plano_de_aula") {
    eventName = "plan_generated";
  } else if (type === "avaliacao") {
    eventName = "evaluation_generated";
  } else if (type) {
    eventName = type;
  }

  const eventMetadata = {
    ...metadata,
  };

  /*
   * Mantemos os dados antigos para compatibilidade com
   * o formato atual do Analytics 2.0.
   */
  if (prompt !== null) {
    eventMetadata.prompt = prompt;
  }

  if (response !== null) {
    eventMetadata.response = response;
  }

  if (error !== null) {
    eventMetadata.error = error;
  }

  await trackEvent({
    eventName,
    featureUsed,
    durationMs,
    success,
    metadata: eventMetadata,
  });
}