import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const ADMIN_PASSWORD = "V@c@R1A2026";
const PROJECT = "vacaria";

const PERIODS = {
  hoje: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  tudo: "Todo período",
};

function getPeriodRange(period) {
  const end = new Date();
  let start = null;

  if (period === "hoje") {
    start = new Date();
    start.setHours(0, 0, 0, 0);
  }

  if (period === "7d") {
    start = new Date();
    start.setDate(start.getDate() - 7);
  }

  if (period === "30d") {
    start = new Date();
    start.setDate(start.getDate() - 30);
  }

  if (period === "90d") {
    start = new Date();
    start.setDate(start.getDate() - 90);
  }

  return {
    start: start ? start.toISOString() : null,
    end: end.toISOString(),
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDuration(ms) {
  const value = Number(ms || 0);

  if (!value) return "—";

  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  const seconds = value / 1000;

  if (seconds < 60) {
    return `${seconds.toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);

  return `${minutes}min ${remaining}s`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function labelEvent(eventName) {
  const labels = {
    page_view: "Visualização de página",
    plan_generated: "Plano de aula gerado",
    evaluation_generated: "Avaliação gerada",
    generation_error: "Erro de geração",
    interaction: "Interação",
  };

  return labels[eventName] || eventName || "Evento";
}

function labelDevice(value) {
  const labels = {
    desktop: "Computador",
    mobile: "Celular",
    tablet: "Tablet",
    unknown: "Desconhecido",
  };

  return labels[value] || value || "Desconhecido";
}

function labelBrowser(value) {
  if (!value) return "Desconhecido";

  const labels = {
    Chrome: "Chrome",
    Firefox: "Firefox",
    Edge: "Edge",
    Safari: "Safari",
    Opera: "Opera",
    SamsungInternet: "Samsung Internet",
    unknown: "Desconhecido",
  };

  return labels[value] || value;
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="analytics-section-title" style={styles.sectionTitle}>
      <span style={styles.eyebrow}>{eyebrow}</span>
      <h3 className="analytics-section-heading" style={styles.sectionHeading}>{title}</h3>
      {description && <p className="analytics-section-description" style={styles.sectionDescription}>{description}</p>}
    </div>
  );
}

function KpiCard({ icon, label, value, detail }) {
  return (
    <div className="analytics-kpi-card" style={styles.kpiCard}>
      <div className="analytics-kpi-top" style={styles.kpiTop}>
        <span style={styles.kpiIcon}>{icon}</span>
        <span style={styles.kpiLabel}>{label}</span>
      </div>

      <div className="analytics-kpi-value" style={styles.kpiValue}>{value}</div>

      {detail && <div className="analytics-kpi-detail" style={styles.kpiDetail}>{detail}</div>}
    </div>
  );
}

function BarList({ items, labelKey, valueKey, total }) {
  if (!items.length) {
    return <div style={styles.empty}>Nenhum dado no período.</div>;
  }

  return (
    <div style={styles.barList}>
      {items.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const percentage = total
          ? Math.max(3, (value / total) * 100)
          : 0;

        return (
          <div key={`${item[labelKey]}-${index}`} style={styles.barItem}>
            <div style={styles.barHeader}>
              <span style={styles.barLabel}>
                {item[labelKey]}
              </span>

              <span style={styles.barValue}>
                {formatNumber(value)}
              </span>
            </div>

            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${Math.min(100, percentage)}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPanel({ onClose }) {
  const [auth, setAuth] = useState(false);
  const [senha, setSenha] = useState("");
  const [erroSenha, setErroSenha] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [periodo, setPeriodo] = useState("30d");

  const [summary, setSummary] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [features, setFeatures] = useState([]);
  const [devices, setDevices] = useState([]);
  const [browsers, setBrowsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [journey, setJourney] = useState([]);
  const [pages, setPages] = useState([]);

  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
  });

  useEffect(() => {
    function handleResize() {
      setViewport({ width: window.innerWidth });
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewport.width <= 640;
  const isTablet = viewport.width > 640 && viewport.width <= 900;
  const isCompact = viewport.width <= 900;

  async function loadAnalytics(selectedPeriod = periodo) {
    setLoading(true);
    setErro("");

    const { start, end } = getPeriodRange(selectedPeriod);

    try {
      const [
        summaryResult,
        dailyResult,
        featuresResult,
        devicesResult,
        browsersResult,
        locationsResult,
        journeyResult,
        pagesResult,
      ] = await Promise.all([
        supabase.rpc("analytics_dashboard_summary", {
          p_project: PROJECT,
          p_start: start,
          p_end: end,
        }),

        supabase.rpc("analytics_daily_stats", {
          p_project: PROJECT,
          p_start: start,
          p_end: end,
        }),

        supabase.rpc("analytics_top_features", {
          p_project: PROJECT,
          p_start: start,
          p_end: end,
        }),

        supabase.rpc("analytics_device_stats", {
          p_project: PROJECT,
          p_start: start,
          p_end: end,
        }),

        supabase.rpc("analytics_browser_stats", {
          p_project: PROJECT,
          p_start: start,
          p_end: end,
        }),

        supabase.rpc("analytics_location_stats", {
          p_project: PROJECT,
          p_start: start,
          p_end: end,
        }),

        supabase.rpc("analytics_journey_stats", {
          p_project: PROJECT,
          p_start: start,
          p_end: end,
        }),

        supabase.rpc("analytics_page_stats", {
          p_project: PROJECT,
          p_start: start,
          p_end: end,
        }),
      ]);

      const results = [
        summaryResult,
        dailyResult,
        featuresResult,
        devicesResult,
        browsersResult,
        locationsResult,
        journeyResult,
        pagesResult,
      ];

      const firstError = results.find((result) => result.error);

      if (firstError?.error) {
        throw new Error(firstError.error.message);
      }

      setSummary(summaryResult.data?.[0] || null);
      setDailyStats(dailyResult.data || []);
      setFeatures(featuresResult.data || []);
      setDevices(devicesResult.data || []);
      setBrowsers(browsersResult.data || []);
      setLocations(locationsResult.data || []);
      setJourney(journeyResult.data || []);
      setPages(pagesResult.data || []);
    } catch (error) {
      console.error("Erro ao carregar Analytics 2.0:", error);
      setErro(
        error?.message ||
          "Não foi possível carregar os dados do Analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (senha === ADMIN_PASSWORD) {
      setAuth(true);
      loadAnalytics("30d");
      return;
    }

    setErroSenha(true);
  }

  function handlePeriodoChange(value) {
    setPeriodo(value);
    loadAnalytics(value);
  }

  useEffect(() => {
    if (!auth) return;

    const interval = setInterval(() => {
      loadAnalytics(periodo);
    }, 60000);

    return () => clearInterval(interval);
  }, [auth, periodo]);

  const totals = useMemo(() => {
    return {
      events: Number(summary?.eventos || 0),
      sessions: Number(summary?.sessoes || 0),
      visitors: Number(summary?.visitantes || 0),
      pageViews: Number(summary?.page_views || 0),
      generations:
        Number(summary?.geracoes_plano || 0) +
        Number(summary?.geracoes_avaliacao || 0),
    };
  }, [summary]);

  const maxDailyEvents = useMemo(() => {
    return Math.max(
      1,
      ...dailyStats.map((item) => Number(item.eventos || 0))
    );
  }, [dailyStats]);

  const topFeatures = useMemo(() => {
    return features.slice(0, 6).map((item) => ({
      ...item,
      display_name:
        item.feature_name === "Outros"
          ? "Outros"
          : item.feature_name || "Sem identificação",
    }));
  }, [features]);

  const topDevices = useMemo(() => {
    return devices.slice(0, 5).map((item) => ({
      ...item,
      device_type: labelDevice(item.device_type),
    }));
  }, [devices]);

  const topBrowsers = useMemo(() => {
    return browsers.slice(0, 5).map((item) => ({
      ...item,
      browser_name: labelBrowser(item.browser_name),
    }));
  }, [browsers]);

  const responsiveStyles = {
    overlay: isMobile
      ? { padding: "8px", alignItems: "stretch" }
      : isTablet
      ? { padding: "12px" }
      : {},

    loginBox: isMobile
      ? { padding: "24px", borderRadius: "16px", margin: "auto 0" }
      : {},

    painel: isMobile
      ? {
          width: "100%",
          maxHeight: "100dvh",
          minHeight: "100dvh",
          borderRadius: "14px",
          padding: "16px",
          gap: "18px",
        }
      : isTablet
      ? {
          width: "100%",
          maxHeight: "96vh",
          padding: "20px",
          gap: "20px",
        }
      : {},

    header: isCompact
      ? {
          flexDirection: "column",
          alignItems: "stretch",
          gap: "14px",
        }
      : {},

    headerActions: isCompact
      ? {
          width: "100%",
          justifyContent: "flex-end",
        }
      : {},

    refreshButton: isMobile
      ? { flex: 1, justifyContent: "center", minHeight: "40px" }
      : {},

    toolbar: isCompact
      ? {
          flexDirection: "column",
          alignItems: "stretch",
          gap: "14px",
        }
      : {},

    liveIndicator: isCompact
      ? { alignSelf: "flex-start", whiteSpace: "normal" }
      : {},

    kpiGrid: isMobile
      ? { gridTemplateColumns: "1fr", gap: "9px" }
      : isTablet
      ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }
      : {},

    kpiCard: isMobile
      ? { padding: "14px", borderRadius: "12px" }
      : {},

    kpiTop: isMobile
      ? { marginBottom: "8px" }
      : {},

    kpiValue: isMobile
      ? { fontSize: "1.45rem" }
      : {},

    kpiDetail: isMobile
      ? { whiteSpace: "normal", lineHeight: 1.35, marginTop: "6px" }
      : {},

    sectionTitle: isMobile
      ? { marginBottom: "11px" }
      : {},

    sectionHeading: isMobile
      ? { fontSize: "1rem" }
      : {},

    sectionDescription: isMobile
      ? { lineHeight: 1.4 }
      : {},

    chartCard: isMobile
      ? { padding: "12px", borderRadius: "12px" }
      : {},

    chart: isMobile
      ? { minHeight: "190px", gap: "4px", paddingTop: "8px" }
      : {},

    chartColumn: isMobile
      ? { minWidth: "26px", height: "180px" }
      : {},

    chartBars: isMobile
      ? { height: "155px" }
      : {},

    twoColumns: isCompact
      ? { gridTemplateColumns: "1fr", gap: "10px" }
      : {},

    panelCard: isMobile
      ? { padding: "15px", borderRadius: "12px" }
      : {},

    barHeader: isMobile
      ? { gap: "8px" }
      : {},

    barLabel: isMobile
      ? { whiteSpace: "normal", overflow: "visible", textOverflow: "clip", lineHeight: 1.3 }
      : {},

    eventRow: isMobile
      ? { padding: "9px 0", gap: "8px" }
      : {},

    eventName: isMobile
      ? { gap: "6px", fontSize: "0.75rem", minWidth: 0 }
      : {},

    eventBullet: isMobile
      ? { width: "22px", flexShrink: 0 }
      : {},

    tableRow: isMobile
      ? { gap: "8px", padding: "9px 0" }
      : {},

    pagePath: isMobile
      ? { whiteSpace: "normal", overflow: "visible", textOverflow: "clip", lineHeight: 1.3, minWidth: 0 }
      : {},

    tableNumber: isMobile
      ? { whiteSpace: "nowrap" }
      : {},

    panelFooter: isCompact
      ? { flexDirection: "column", gap: "6px" }
      : {},
  };

  if (!auth) {
    return (
      <div style={{ ...styles.overlay, ...responsiveStyles.overlay }}>
        <div style={{ ...styles.loginBox, ...responsiveStyles.loginBox }}>
          <div style={styles.loginIcon}>🔐</div>

          <h2 style={styles.loginTitle}>Analytics VacarIA</h2>

          <p style={styles.loginSubtitle}>
            Área administrativa protegida
          </p>

          <input
            type="password"
            placeholder="Digite a senha"
            value={senha}
            onChange={(event) => {
              setSenha(event.target.value);
              setErroSenha(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleLogin();
              }
            }}
            style={styles.input}
            autoFocus
          />

          {erroSenha && (
            <p style={styles.erroSenha}>
              Senha incorreta.
            </p>
          )}

          <button
            onClick={handleLogin}
            style={styles.btnLogin}
          >
            Entrar no Analytics
          </button>

          <button
            onClick={onClose}
            style={styles.btnFechar}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.overlay, ...responsiveStyles.overlay }}>
      <div style={{ ...styles.painel, ...responsiveStyles.painel }}>
        <style>{`
          @media (max-width: 640px) {
            .analytics-kpi-card { padding: 14px !important; border-radius: 12px !important; }
            .analytics-kpi-top { margin-bottom: 8px !important; }
            .analytics-kpi-value { font-size: 1.45rem !important; }
            .analytics-kpi-detail { white-space: normal !important; line-height: 1.35 !important; margin-top: 6px !important; }
            .analytics-section-title { margin-bottom: 11px !important; }
            .analytics-section-heading { font-size: 1rem !important; }
            .analytics-section-description { line-height: 1.4 !important; }
          }
        `}</style>
        <header style={{ ...styles.header, ...responsiveStyles.header }}>
          <div>
            <div style={styles.headerEyebrow}>
              VACARIA · ANALYTICS 2.0
            </div>

            <h2 style={styles.title}>
              Painel de Gestão
            </h2>

            <p style={styles.headerDescription}>
              Visão geral do uso do VacarIA
            </p>
          </div>

          <div style={{ ...styles.headerActions, ...responsiveStyles.headerActions }}>
            <button
              onClick={() => loadAnalytics(periodo)}
              disabled={loading}
              style={{ ...styles.refreshButton, ...responsiveStyles.refreshButton }}
              title="Atualizar dados"
            >
              {loading ? "⟳" : "↻"}
              <span>Atualizar</span>
            </button>

            <button
              onClick={onClose}
              style={styles.btnX}
              aria-label="Fechar painel"
            >
              ✕
            </button>
          </div>
        </header>

        <div style={{ ...styles.toolbar, ...responsiveStyles.toolbar }}>
          <div>
            <span style={styles.toolbarLabel}>
              Período
            </span>

            <div style={styles.periodButtons}>
              {Object.entries(PERIODS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handlePeriodoChange(key)}
                  style={
                    periodo === key
                      ? styles.periodActive
                      : styles.periodButton
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...styles.liveIndicator, ...responsiveStyles.liveIndicator }}>
            <span style={styles.liveDot} />
            Dados atualizados automaticamente
          </div>
        </div>

        {erro && (
          <div style={styles.errorBox}>
            <strong>Não foi possível carregar o Analytics.</strong>
            <span>{erro}</span>
          </div>
        )}

        {loading && !summary ? (
          <div style={styles.loadingBox}>
            <div style={styles.loadingSpinner}>⟳</div>
            <p>Carregando Analytics 2.0...</p>
          </div>
        ) : (
          <>
            {/* ================================================= */}
            {/* KPIs */}
            {/* ================================================= */}

            <section>
              <SectionTitle
                eyebrow="VISÃO GERAL"
                title="Indicadores principais"
                description={`Período: ${PERIODS[periodo]}`}
              />

              <div style={{ ...styles.kpiGrid, ...responsiveStyles.kpiGrid }}>
                <KpiCard
                  icon="👥"
                  label="Visitantes"
                  value={formatNumber(totals.visitors)}
                  detail="visitantes únicos"
                />

                <KpiCard
                  icon="🧭"
                  label="Sessões"
                  value={formatNumber(totals.sessions)}
                  detail="sessões iniciadas"
                />

                <KpiCard
                  icon="⚡"
                  label="Eventos"
                  value={formatNumber(totals.events)}
                  detail={`${formatNumber(totals.pageViews)} visualizações`}
                />

                <KpiCard
                  icon="✨"
                  label="Gerações"
                  value={formatNumber(totals.generations)}
                  detail={`${formatNumber(
                    summary?.geracoes_plano
                  )} planos · ${formatNumber(
                    summary?.geracoes_avaliacao
                  )} avaliações`}
                />

                <KpiCard
                  icon="✅"
                  label="Taxa de sucesso"
                  value={formatPercent(summary?.taxa_sucesso)}
                  detail={`${formatNumber(
                    summary?.eventos_sucesso
                  )} eventos bem-sucedidos`}
                />

                <KpiCard
                  icon="⏱️"
                  label="Duração média"
                  value={formatDuration(summary?.duracao_media_ms)}
                  detail="eventos com duração registrada"
                />
              </div>
            </section>

            {/* ================================================= */}
            {/* EVOLUÇÃO */}
            {/* ================================================= */}

            <section style={styles.section}>
              <SectionTitle
                eyebrow="EVOLUÇÃO"
                title="Atividade ao longo do tempo"
                description="Eventos e sessões registrados no período selecionado."
              />

              <div style={{ ...styles.chartCard, ...responsiveStyles.chartCard }}>
                {dailyStats.length ? (
                  <div style={{ ...styles.chart, ...responsiveStyles.chart }}>
                    {dailyStats.map((item, index) => {
                      const events = Number(item.eventos || 0);
                      const sessions = Number(item.sessoes || 0);

                      const eventHeight =
                        Math.max(
                          4,
                          (events / maxDailyEvents) * 180
                        );

                      return (
                        <div
                          key={`${item.dia}-${index}`}
                          style={{ ...styles.chartColumn, ...responsiveStyles.chartColumn }}
                          title={`${formatDate(item.dia)} — ${formatNumber(
                            events
                          )} eventos · ${formatNumber(
                            sessions
                          )} sessões`}
                        >
                          <div style={{ ...styles.chartBars, ...responsiveStyles.chartBars }}>
                            <div
                              style={{
                                ...styles.chartBar,
                                height: `${eventHeight}px`,
                              }}
                            />

                            {sessions > 0 && (
                              <div
                                style={{
                                  ...styles.chartBarSecondary,
                                  height: `${Math.max(
                                    4,
                                    Math.min(
                                      180,
                                      (sessions / maxDailyEvents) *
                                        180
                                    )
                                  )}px`,
                                }}
                              />
                            )}
                          </div>

                          <span style={styles.chartLabel}>
                            {formatDate(item.dia)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.empty}>
                    Nenhuma atividade registrada neste período.
                  </div>
                )}

                <div style={styles.chartLegend}>
                  <span>
                    <i style={styles.legendPrimary} />
                    Eventos
                  </span>

                  <span>
                    <i style={styles.legendSecondary} />
                    Sessões
                  </span>
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* RECURSOS */}
            {/* ================================================= */}

            <section style={styles.section}>
              <div style={{ ...styles.twoColumns, ...responsiveStyles.twoColumns }}>
                <div style={{ ...styles.panelCard, ...responsiveStyles.panelCard }}>
                  <SectionTitle
                    eyebrow="RECURSOS"
                    title="O que está sendo utilizado?"
                    description="Eventos de uso, excluindo visualizações de página."
                  />

                  <BarList
                    items={topFeatures.map((item) => ({
                      ...item,
                      feature_name: item.display_name,
                    }))}
                    labelKey="feature_name"
                    valueKey="total_usos"
                    total={Math.max(
                      1,
                      features.reduce(
                        (sum, item) =>
                          sum + Number(item.total_usos || 0),
                        0
                      )
                    )}
                  />
                </div>

                <div style={{ ...styles.panelCard, ...responsiveStyles.panelCard }}>
                  <SectionTitle
                    eyebrow="JORNADA"
                    title="Tipos de evento"
                    description="Como os usuários interagem com o sistema."
                  />

                  <div style={styles.eventList}>
                    {journey.length ? (
                      journey.slice(0, 8).map((item, index) => (
                        <div
                          key={`${item.event_name}-${index}`}
                          style={{ ...styles.eventRow, ...responsiveStyles.eventRow }}
                        >
                          <div style={{ ...styles.eventName, ...responsiveStyles.eventName }}>
                            <span style={{ ...styles.eventBullet, ...responsiveStyles.eventBullet }}>
                              {item.event_name === "page_view"
                                ? "👁️"
                                : item.event_name ===
                                  "plan_generated"
                                ? "📘"
                                : item.event_name ===
                                  "evaluation_generated"
                                ? "📝"
                                : item.event_name ===
                                  "generation_error"
                                ? "⚠️"
                                : "•"}
                            </span>

                            {labelEvent(item.event_name)}
                          </div>

                          <div style={styles.eventNumber}>
                            {formatNumber(item.total)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.empty}>
                        Nenhum evento encontrado.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* TECNOLOGIA */}
            {/* ================================================= */}

            <section style={styles.section}>
              <div style={{ ...styles.twoColumns, ...responsiveStyles.twoColumns }}>
                <div style={{ ...styles.panelCard, ...responsiveStyles.panelCard }}>
                  <SectionTitle
                    eyebrow="TECNOLOGIA"
                    title="Dispositivos"
                    description="Distribuição das sessões por dispositivo."
                  />

                  <BarList
                    items={topDevices}
                    labelKey="device_type"
                    valueKey="total"
                    total={Math.max(
                      1,
                      devices.reduce(
                        (sum, item) =>
                          sum + Number(item.total || 0),
                        0
                      )
                    )}
                  />
                </div>

                <div style={{ ...styles.panelCard, ...responsiveStyles.panelCard }}>
                  <SectionTitle
                    eyebrow="TECNOLOGIA"
                    title="Navegadores"
                    description="Distribuição das sessões por navegador."
                  />

                  <BarList
                    items={topBrowsers}
                    labelKey="browser_name"
                    valueKey="total"
                    total={Math.max(
                      1,
                      browsers.reduce(
                        (sum, item) =>
                          sum + Number(item.total || 0),
                        0
                      )
                    )}
                  />
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* PÁGINAS */}
            {/* ================================================= */}

            <section style={styles.section}>
              <div style={{ ...styles.twoColumns, ...responsiveStyles.twoColumns }}>
                <div style={{ ...styles.panelCard, ...responsiveStyles.panelCard }}>
                  <SectionTitle
                    eyebrow="NAVEGAÇÃO"
                    title="Páginas mais acessadas"
                    description="Principais caminhos visitados no VacarIA."
                  />

                  {pages.length ? (
                    <div style={styles.tableList}>
                      {pages.slice(0, 10).map((page, index) => (
                        <div
                          key={`${page.page_path}-${index}`}
                          style={{ ...styles.tableRow, ...responsiveStyles.tableRow }}
                        >
                          <div style={styles.rank}>
                            {index + 1}
                          </div>

                          <div style={{ ...styles.pagePath, ...responsiveStyles.pagePath }}>
                            {page.page_path}
                            <small>
                              {formatNumber(page.visitantes)} visitantes
                            </small>
                          </div>

                          <strong style={{ ...styles.tableNumber, ...responsiveStyles.tableNumber }}>
                            {formatNumber(page.total)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.empty}>
                      Nenhuma página encontrada.
                    </div>
                  )}
                </div>

                {/* ================================================= */}
                {/* LOCALIZAÇÕES */}
                {/* ================================================= */}

                <div style={{ ...styles.panelCard, ...responsiveStyles.panelCard }}>
                  <SectionTitle
                    eyebrow="GEOGRAFIA"
                    title="Localizações"
                    description="Cidades identificadas entre as sessões."
                  />

                  {locations.length ? (
                    <div style={styles.tableList}>
                      {locations.slice(0, 10).map((location, index) => (
                        <div
                          key={`${location.cidade}-${location.regiao}-${index}`}
                          style={{ ...styles.tableRow, ...responsiveStyles.tableRow }}
                        >
                          <div style={styles.rank}>
                            {index + 1}
                          </div>

                          <div style={{ ...styles.pagePath, ...responsiveStyles.pagePath }}>
                            {location.cidade}
                            <small>
                              {location.regiao} · {location.pais}
                            </small>
                          </div>

                          <strong style={{ ...styles.tableNumber, ...responsiveStyles.tableNumber }}>
                            {formatNumber(location.total)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.empty}>
                      Nenhuma localização encontrada.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* RODAPÉ DO PAINEL */}
            {/* ================================================= */}

            <footer style={{ ...styles.panelFooter, ...responsiveStyles.panelFooter }}>
              <span>
                VacarIA · Analytics 2.0
              </span>

              <span>
                Atualização automática a cada 60 segundos
              </span>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.94)",
    backdropFilter: "blur(8px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  loginBox: {
    width: "min(420px, 100%)",
    background: "linear-gradient(145deg, #111827, #0b1120)",
    border: "1px solid #273449",
    borderRadius: "20px",
    padding: "36px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    alignItems: "stretch",
    boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
  },

  loginIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "16px",
    background: "rgba(108,99,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.7rem",
    marginBottom: "4px",
  },

  loginTitle: {
    color: "#fff",
    margin: 0,
    fontSize: "1.5rem",
  },

  loginSubtitle: {
    color: "#94a3b8",
    margin: "0 0 8px",
    fontSize: "0.9rem",
  },

  input: {
    padding: "13px 15px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#070d19",
    color: "#fff",
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },

  erroSenha: {
    color: "#f87171",
    margin: 0,
    fontSize: "0.85rem",
  },

  btnLogin: {
    background: "linear-gradient(135deg, #6c63ff, #5148d8)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "13px 20px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 700,
    marginTop: "4px",
  },

  btnFechar: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "11px 20px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },

  painel: {
    background: "#070d19",
    border: "1px solid #1e293b",
    borderRadius: "22px",
    width: "min(1400px, 96vw)",
    maxHeight: "94vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    padding: "28px",
    gap: "22px",
    boxShadow: "0 30px 120px rgba(0,0,0,0.55)",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  headerEyebrow: {
    color: "#818cf8",
    fontSize: "0.7rem",
    fontWeight: 800,
    letterSpacing: "0.14em",
    marginBottom: "5px",
  },

  title: {
    color: "#fff",
    margin: 0,
    fontSize: "1.65rem",
    lineHeight: 1.2,
  },

  headerDescription: {
    color: "#64748b",
    margin: "6px 0 0",
    fontSize: "0.88rem",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "#111827",
    color: "#cbd5e1",
    border: "1px solid #263244",
    borderRadius: "9px",
    padding: "9px 13px",
    cursor: "pointer",
    fontSize: "0.82rem",
  },

  btnX: {
    background: "#111827",
    color: "#94a3b8",
    border: "1px solid #263244",
    width: "38px",
    height: "38px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "1rem",
  },

  toolbar: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    padding: "15px 16px",
    background: "#0b1220",
    border: "1px solid #182336",
    borderRadius: "14px",
  },

  toolbarLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "0.72rem",
    fontWeight: 700,
    marginBottom: "7px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  periodButtons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  periodButton: {
    background: "#111827",
    color: "#94a3b8",
    border: "1px solid #263244",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "0.78rem",
  },

  periodActive: {
    background: "#6c63ff",
    color: "#fff",
    border: "1px solid #6c63ff",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 700,
  },

  liveIndicator: {
    color: "#64748b",
    fontSize: "0.74rem",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    whiteSpace: "nowrap",
  },

  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px rgba(34,197,94,0.7)",
  },

  section: {
    marginTop: "2px",
  },

  sectionTitle: {
    marginBottom: "14px",
  },

  eyebrow: {
    display: "block",
    color: "#6366f1",
    fontSize: "0.65rem",
    fontWeight: 800,
    letterSpacing: "0.13em",
    marginBottom: "4px",
  },

  sectionHeading: {
    color: "#f8fafc",
    margin: 0,
    fontSize: "1.05rem",
  },

  sectionDescription: {
    color: "#64748b",
    margin: "4px 0 0",
    fontSize: "0.78rem",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: "10px",
  },

  kpiCard: {
    background: "linear-gradient(145deg, #0d1626, #0a111e)",
    border: "1px solid #1b293d",
    borderRadius: "14px",
    padding: "15px",
    minWidth: 0,
  },

  kpiTop: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "12px",
  },

  kpiIcon: {
    fontSize: "0.95rem",
  },

  kpiLabel: {
    color: "#94a3b8",
    fontSize: "0.72rem",
    fontWeight: 600,
  },

  kpiValue: {
    color: "#f8fafc",
    fontSize: "1.55rem",
    fontWeight: 800,
    lineHeight: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  kpiDetail: {
    color: "#475569",
    fontSize: "0.67rem",
    marginTop: "8px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  chartCard: {
    background: "#0b1220",
    border: "1px solid #182336",
    borderRadius: "14px",
    padding: "20px",
    overflow: "hidden",
  },

  chart: {
    minHeight: "220px",
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
    overflowX: "auto",
    paddingTop: "15px",
  },

  chartColumn: {
    minWidth: "30px",
    flex: "1 0 30px",
    maxWidth: "60px",
    height: "205px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    cursor: "default",
  },

  chartBars: {
    height: "180px",
    display: "flex",
    alignItems: "flex-end",
    gap: "2px",
  },

  chartBar: {
    width: "9px",
    minHeight: "4px",
    background: "#6c63ff",
    borderRadius: "3px 3px 0 0",
    transition: "height 0.3s ease",
  },

  chartBarSecondary: {
    width: "6px",
    minHeight: "4px",
    background: "#334155",
    borderRadius: "3px 3px 0 0",
  },

  chartLabel: {
    color: "#475569",
    fontSize: "0.6rem",
    marginTop: "8px",
    whiteSpace: "nowrap",
  },

  chartLegend: {
    display: "flex",
    gap: "18px",
    marginTop: "12px",
    color: "#64748b",
    fontSize: "0.72rem",
  },

  legendPrimary: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "2px",
    background: "#6c63ff",
    marginRight: "5px",
  },

  legendSecondary: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "2px",
    background: "#334155",
    marginRight: "5px",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  panelCard: {
    background: "#0b1220",
    border: "1px solid #182336",
    borderRadius: "14px",
    padding: "19px",
    minWidth: 0,
  },

  barList: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },

  barItem: {
    width: "100%",
  },

  barHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "6px",
  },

  barLabel: {
    color: "#cbd5e1",
    fontSize: "0.78rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  barValue: {
    color: "#94a3b8",
    fontSize: "0.72rem",
    fontWeight: 700,
  },

  barTrack: {
    height: "6px",
    background: "#172235",
    borderRadius: "999px",
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6c63ff, #818cf8)",
    borderRadius: "999px",
    transition: "width 0.4s ease",
  },

  eventList: {
    display: "flex",
    flexDirection: "column",
  },

  eventRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #172235",
  },

  eventName: {
    color: "#cbd5e1",
    fontSize: "0.78rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  eventBullet: {
    width: "24px",
    textAlign: "center",
  },

  eventNumber: {
    color: "#f8fafc",
    fontSize: "0.8rem",
    fontWeight: 700,
  },

  tableList: {
    display: "flex",
    flexDirection: "column",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "28px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "10px",
    padding: "10px 0",
    borderBottom: "1px solid #172235",
  },

  rank: {
    color: "#475569",
    fontSize: "0.7rem",
    fontWeight: 800,
    textAlign: "center",
  },

  pagePath: {
    color: "#cbd5e1",
    fontSize: "0.78rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  tableNumber: {
    color: "#f8fafc",
    fontSize: "0.8rem",
  },

  empty: {
    color: "#475569",
    textAlign: "center",
    padding: "28px 10px",
    fontSize: "0.8rem",
  },

  loadingBox: {
    minHeight: "420px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },

  loadingSpinner: {
    fontSize: "2rem",
    color: "#6c63ff",
    animation: "spin 1s linear infinite",
  },

  errorBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    background: "rgba(127,29,29,0.2)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#fca5a5",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "0.78rem",
  },

  panelFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    color: "#334155",
    fontSize: "0.68rem",
    borderTop: "1px solid #172235",
    paddingTop: "15px",
  },
};