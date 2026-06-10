import { useMemo, useRef, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import {
  deals as allDeals, clients, managers, formatShort, paymentStatusColor,
  type Deal,
} from "@/data/demo";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui-bits";
import { Filter, SearchX, ChevronDown, ChevronUp, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// ===== Бизнес-логика риска =====

const MARGIN_THRESHOLD = 20; // %
const IDLE_THRESHOLD = 7; // дней без движения

const CLOSED_STAGES = new Set(["Выиграна", "Потеряна"]);

const idleTable = [3, 5, 9, 12, 4, 8, 2, 11, 6, 14];
function daysIdle(d: Deal): number {
  if (CLOSED_STAGES.has(d.stage)) return 0;
  const n = parseInt(d.id.slice(1), 10) || 0;
  return idleTable[n % idleTable.length];
}

const riskClientNames = new Set(
  clients.filter(c => c.status === "риск" || c.status === "стоп").map(c => c.name)
);

type ZoneKey = "norm" | "cheap" | "stuck" | "critical";

function zoneOf(d: Deal): ZoneKey {
  const idle = daysIdle(d);
  const low = d.marginPct < MARGIN_THRESHOLD;
  const stuck = idle > IDLE_THRESHOLD;
  if (low && stuck) return "critical";
  if (low) return "cheap";
  if (stuck) return "stuck";
  return "norm";
}

function isPaymentRisk(d: Deal): boolean {
  if (CLOSED_STAGES.has(d.stage) && d.paymentStatus === "оплачено") return false;
  return riskClientNames.has(d.client);
}

const zoneMeta: Record<ZoneKey, { label: string; short: string; color: string; bg: string; border: string; reason: string }> = {
  norm:     { label: "Норма",        short: "Норма",        color: "hsl(var(--success))",     bg: "bg-success/10",     border: "border-success/30",     reason: "Маржа в норме, сделка движется" },
  cheap:    { label: "Ниже маржи",   short: "Ниже маржи",   color: "hsl(var(--warning))",     bg: "bg-warning/10",     border: "border-warning/30",     reason: `Маржа ниже ${MARGIN_THRESHOLD}%, но сделка движется` },
  stuck:    { label: "Без движения", short: "Без движения", color: "hsl(var(--accent))",      bg: "bg-accent/10",      border: "border-accent/30",      reason: `Маржа в норме, но нет движения > ${IDLE_THRESHOLD} дней` },
  critical: { label: "Критичная",    short: "Критичная",    color: "hsl(var(--destructive))", bg: "bg-destructive/10", border: "border-destructive/40", reason: `Маржа ниже ${MARGIN_THRESHOLD}% и нет движения > ${IDLE_THRESHOLD} дней` },
};

const activeDeals = allDeals.filter(d => !CLOSED_STAGES.has(d.stage));
const paymentRiskDeals = allDeals.filter(isPaymentRisk);

type FilterKey = ZoneKey | "payment";

const filterShort: Record<FilterKey, string> = {
  critical: "Критичная",
  cheap:    "Ниже маржи",
  stuck:    "Без движения",
  payment:  "Риск оплаты",
  norm:     "Норма",
};

const filterMeta: Record<FilterKey, { color: string; bg: string; border: string; reason: string }> = {
  critical: { color: zoneMeta.critical.color, bg: zoneMeta.critical.bg, border: zoneMeta.critical.border, reason: zoneMeta.critical.reason },
  cheap:    { color: zoneMeta.cheap.color,    bg: zoneMeta.cheap.bg,    border: zoneMeta.cheap.border,    reason: zoneMeta.cheap.reason },
  stuck:    { color: zoneMeta.stuck.color,    bg: zoneMeta.stuck.bg,    border: zoneMeta.stuck.border,    reason: zoneMeta.stuck.reason },
  norm:     { color: zoneMeta.norm.color,     bg: zoneMeta.norm.bg,     border: zoneMeta.norm.border,     reason: zoneMeta.norm.reason },
  payment:  { color: "hsl(var(--destructive))", bg: "bg-destructive/5", border: "border-destructive/30", reason: "Клиенты уже имеют просрочку или долг" },
};

function dealsForFilter(key: FilterKey): Deal[] {
  if (key === "payment") return paymentRiskDeals;
  return activeDeals.filter(d => zoneOf(d) === key);
}

function actionFor(key: FilterKey): string {
  switch (key) {
    case "critical": return "Срочно связаться с клиентом и пересчитать маржу";
    case "cheap":    return "Пересмотреть цену или согласовать скидку";
    case "stuck":    return "Возобновить контакт и назначить следующий шаг";
    case "payment":  return "Усилить контроль оплаты, не отгружать без предоплаты";
    default:         return "Контролировать стандартно";
  }
}

function pluralDeals(n: number): string {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "сделок";
  const m10 = n % 10;
  if (m10 === 1) return "сделка";
  if (m10 >= 2 && m10 <= 4) return "сделки";
  return "сделок";
}

function pointZoneLabel(marginPct: number, idle: number): string {
  const low = marginPct < MARGIN_THRESHOLD;
  const stuck = idle > IDLE_THRESHOLD;
  if (low && stuck) return "критичная";
  if (low) return "продали дёшево";
  if (stuck) return "зависла";
  return "норма";
}

// ===== Страница =====

export default function Deals() {
  const isMobile = useIsMobile();
  const [active, setActive] = useState<FilterKey | null>("critical");
  const [shownAll, setShownAll] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGroup, setDetailGroup] = useState<FilterKey | null>(null);
  const [detailShownAll, setDetailShownAll] = useState(false);
  

  const chartRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const filterRowRef = useRef<HTMLDivElement>(null);
  const detailHeaderRef = useRef<HTMLButtonElement>(null);
  const detailGroupRef = useRef<HTMLDivElement>(null);

  const lowMargin = activeDeals.filter(d => d.marginPct < MARGIN_THRESHOLD).length;
  const stuckCount = activeDeals.filter(d => daysIdle(d) > IDLE_THRESHOLD).length;
  const paymentRiskCount = paymentRiskDeals.length;

  const scatterData = useMemo(() => activeDeals.map(d => ({
    x: d.marginPct,
    y: daysIdle(d),
    z: Math.max(d.amount / 1000, 60),
    zone: zoneOf(d),
    amount: d.amount,
    id: d.id,
  })), []);

  const byZone = useMemo(() => {
    const acc: Record<ZoneKey, typeof scatterData> = { norm: [], cheap: [], stuck: [], critical: [] };
    scatterData.forEach(p => acc[p.zone].push(p));
    return acc;
  }, [scatterData]);

  const panelDeals = active ? dealsForFilter(active) : [];
  const visiblePanelDeals = shownAll ? panelDeals : panelDeals.slice(0, 5);

  const scrollTo = (el: HTMLElement | null) => {
    if (!el) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  };

  const pickFilter = (key: FilterKey) => {
    setShownAll(false);
    setActive(key);
    scrollTo(panelRef.current);
  };

  const closePanel = () => {
    setActive(null);
    setShownAll(false);
    scrollTo(filterRowRef.current);
  };

  const toggleDetail = () => {
    setDetailOpen(v => {
      const next = !v;
      if (!next) {
        setDetailGroup(null);
        setDetailShownAll(false);
      }
      scrollTo(detailHeaderRef.current);
      return next;
    });
  };

  const pickDetailGroup = (key: FilterKey) => {
    setDetailShownAll(false);
    setDetailGroup(key);
    scrollTo(detailGroupRef.current);
  };

  const closeDetailGroup = () => {
    setDetailGroup(null);
    setDetailShownAll(false);
    scrollTo(detailHeaderRef.current);
  };

  return (
    <>
      <PageHeader
        back={{ to: "/", label: "Дашборд" }}
        title="Сделки"
        subtitle={`${activeDeals.length} активных · ${lowMargin} ниже маржи · ${stuckCount} без движения · ${paymentRiskCount} риск оплаты`}
      />

      {/* === Матрица риска === */}
      <Card
        title="Матрица риска сделок"
        subtitle={`Маржа × дни без движения · порог ${MARGIN_THRESHOLD}% и ${IDLE_THRESHOLD} дн`}
        className="mb-3"
      >
        <div ref={chartRef} className="h-[260px] lg:h-[360px] -mx-1 scroll-mt-24">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 28, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number" dataKey="x" name="Маржа" unit="%"
                domain={[0, 45]} ticks={[0, 10, 20, 30, 40]}
                stroke="hsl(var(--muted-foreground))" fontSize={11}
                label={{ value: "Маржа, %", position: "insideBottom", offset: -14, fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                type="number" dataKey="y" name="Без движения" unit="д"
                domain={[0, 16]} ticks={[0, 7, 14]}
                stroke="hsl(var(--muted-foreground))" fontSize={11}
                width={32}
              />
              <ZAxis type="number" dataKey="z" range={[50, 380]} />

              <ReferenceArea x1={0}  x2={MARGIN_THRESHOLD} y1={IDLE_THRESHOLD} y2={16} fill="hsl(var(--destructive))" fillOpacity={0.10} />
              <ReferenceArea x1={MARGIN_THRESHOLD} x2={45} y1={IDLE_THRESHOLD} y2={16} fill="hsl(var(--accent))" fillOpacity={0.08} />
              <ReferenceArea x1={0}  x2={MARGIN_THRESHOLD} y1={0} y2={IDLE_THRESHOLD} fill="hsl(var(--warning))" fillOpacity={0.08} />

              <ReferenceLine x={MARGIN_THRESHOLD} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
              <ReferenceLine y={IDLE_THRESHOLD}   stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />

              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                wrapperStyle={{ outline: "none", zIndex: 50 }}
                content={<PointTooltip />}
                trigger={isMobile ? "click" : "hover"}
              />

              {(Object.keys(byZone) as ZoneKey[]).map(z => (
                <Scatter
                  key={z}
                  data={byZone[z]}
                  fill={zoneMeta[z].color}
                  fillOpacity={0.75}
                  stroke={zoneMeta[z].color}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>


        {/* Легенда зон */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
          {(["critical", "cheap", "stuck", "norm"] as ZoneKey[]).map(z => (
            <div key={z} className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 border", zoneMeta[z].bg, zoneMeta[z].border)}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: zoneMeta[z].color }} />
              <span className="truncate">{zoneMeta[z].short}</span>
              <span className="ml-auto num font-semibold">{byZone[z].length}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* === Фильтры риска === */}
      <div ref={filterRowRef} className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 mb-3 scroll-mt-24">
        {(["critical", "cheap", "stuck", "payment"] as FilterKey[]).map(k => {
          const count = dealsForFilter(k).length;
          const isActive = active === k;
          return (
            <button
              key={k}
              onClick={() => pickFilter(k)}
              className={cn(
                "text-xs px-2.5 py-2 rounded-md border transition-colors flex items-center justify-between gap-2",
                isActive
                  ? "bg-accent text-accent-foreground border-accent font-medium"
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <span className="truncate">{filterShort[k]}</span>
              <span className="num shrink-0">· {count}</span>
            </button>
          );
        })}
      </div>

      {/* === Панель детализации === */}
      <div ref={panelRef} className="scroll-mt-24">
        {active && <DetailPanel
          filter={active}
          deals={visiblePanelDeals}
          total={panelDeals.length}
          shownAll={shownAll}
          onShowAll={() => setShownAll(true)}
          onClose={closePanel}
          onBackToChart={() => scrollTo(chartRef.current)}
        />}
      </div>

      {/* === Детализация === */}
      <div className="mt-4">
        <button
          ref={detailHeaderRef}
          onClick={toggleDetail}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors scroll-mt-24"
        >
          <div className="text-sm font-medium">Детализация · {activeDeals.length + paymentRiskCount} сделок</div>
          {detailOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {detailOpen && (
          <>
            {/* Mobile: группы → одна группа → 5 сделок */}
            <div className="lg:hidden mt-2">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <button
                  onClick={() => scrollTo(chartRef.current)}
                  className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ArrowUp className="h-3 w-3" /> К матрице риска
                </button>
                <button
                  onClick={toggleDetail}
                  className="text-[12px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50"
                >
                  Закрыть
                </button>
              </div>

              <div className="grid gap-2">
                {(["critical", "cheap", "stuck", "payment", "norm"] as FilterKey[]).map(k => {
                  const list = dealsForFilter(k);
                  const sum = list.reduce((s, d) => s + d.amount, 0);
                  const isOpen = detailGroup === k;
                  const meta = filterMeta[k];
                  return (
                    <div key={k}>
                      <button
                        onClick={() => isOpen ? closeDetailGroup() : pickDetailGroup(k)}
                        className={cn(
                          "w-full text-left rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2 transition-colors",
                          isOpen ? cn(meta.bg, meta.border) : "bg-card border-border hover:bg-muted/40"
                        )}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: meta.color }} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate">{filterShort[k]}</div>
                            <div className="text-[11px] text-muted-foreground num">
                              {list.length} {pluralDeals(list.length)} · {formatShort(sum)} ₽
                            </div>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>

                      {isOpen && (
                        <div ref={detailGroupRef} className="mt-2 scroll-mt-24">
                          <div className={cn("rounded-lg border p-3", meta.bg, meta.border)}>
                            <div className="text-[12px] text-muted-foreground mb-2">
                              Причина: {meta.reason}
                            </div>
                            {list.length === 0 ? (
                              <div className="text-[12px] text-muted-foreground">Сделок в этой группе нет.</div>
                            ) : (
                              <div className="space-y-2">
                                {(detailShownAll ? list : list.slice(0, 5)).map(d => (
                                  <DealRow key={d.id} d={d} filter={k} />
                                ))}
                                {!detailShownAll && list.length > 5 && (
                                  <button
                                    onClick={() => setDetailShownAll(true)}
                                    className="w-full text-xs px-3 py-2 rounded-md border border-border bg-card hover:bg-muted/40"
                                  >
                                    Показать ещё {list.length - 5}
                                  </button>
                                )}
                              </div>
                            )}
                            <button
                              onClick={closeDetailGroup}
                              className="mt-3 w-full text-[12px] px-3 py-2 rounded-md border border-border bg-card hover:bg-muted/40 text-muted-foreground"
                            >
                              Закрыть группу
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: подробные фильтры и таблица */}
            <div className="hidden lg:block">
              <AllDealsTable />
            </div>
          </>
        )}
      </div>
    </>
  );
}

type PointPayload = { x?: number; y?: number; amount?: number };
function PointTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PointPayload }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const margin = Math.round(p.x ?? 0);
  const idle = Math.round(p.y ?? 0);
  const amount = p.amount ?? 0;
  const zone = pointZoneLabel(margin, idle);
  return (
    <div
      className="rounded-[10px] shadow-elevated px-3 py-2.5 text-[12px] leading-tight max-w-[220px]"
      style={{
        background: "hsl(222 38% 12%)",
        border: "1px solid hsl(0 0% 100% / 0.18)",
        color: "hsl(0 0% 100%)",
      }}
    >
      <div className="font-semibold uppercase tracking-wide mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>
        Зона: {zone}
      </div>
      <div className="space-y-1 num">
        <Row label="Сумма" value={`${formatShort(amount)} ₽`} />
        <Row label="Маржа" value={`${margin}%`} danger={margin < MARGIN_THRESHOLD} />
        <Row label="Без движения" value={`${idle} дн`} danger={idle > IDLE_THRESHOLD} />
      </div>
    </div>
  );
}


function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span style={{ color: "hsl(220 18% 78%)" }}>{label}:</span>
      <span className="font-semibold text-right" style={{ color: danger ? "hsl(0 90% 72%)" : "hsl(0 0% 100%)" }}>{value}</span>
    </div>
  );
}

// ===== Панель детализации =====

function DetailPanel({
  filter, deals, total, shownAll, onShowAll, onClose, onBackToChart,
}: {
  filter: FilterKey; deals: Deal[]; total: number;
  shownAll: boolean; onShowAll: () => void; onClose: () => void; onBackToChart: () => void;
}) {
  const meta = filterMeta[filter];
  const all = filter === "payment" ? paymentRiskDeals : activeDeals.filter(d => zoneOf(d) === filter);
  const totalSum = all.reduce((s, d) => s + d.amount, 0);
  const action = actionFor(filter);

  return (
    <div className={cn("rounded-lg border p-4", meta.bg, meta.border)}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: meta.color }} />
            <h3 className="font-display text-base font-semibold">{filterShort[filter]}</h3>
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5 num">
            {total} {pluralDeals(total)} · {formatShort(totalSum)} ₽
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5">{meta.reason}</div>
        </div>
        <button
          onClick={onClose}
          className="text-[12px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 shrink-0"
        >
          Закрыть
        </button>
      </div>

      <div className="mt-2 text-[12px] rounded-md border border-border bg-card/60 px-2.5 py-1.5">
        <span className="text-muted-foreground">Действие: </span>{action}
      </div>

      {deals.length === 0 ? (
        <div className="text-[12px] text-muted-foreground mt-3">Сделок в этой зоне нет.</div>
      ) : (
        <div className="mt-3 space-y-2">
          {deals.map(d => <DealRow key={d.id} d={d} filter={filter} />)}
          {!shownAll && total > deals.length && (
            <button
              onClick={onShowAll}
              className="w-full text-xs px-3 py-2 rounded-md border border-border bg-card hover:bg-muted/40"
            >
              Показать ещё {total - deals.length}
            </button>
          )}
        </div>
      )}

      <button
        onClick={onBackToChart}
        className="mt-3 w-full text-[12px] px-3 py-2 rounded-md border border-border bg-card hover:bg-muted/40 flex items-center justify-center gap-1.5 text-muted-foreground"
      >
        <ArrowUp className="h-3 w-3" /> Вернуться к графику
      </button>
    </div>
  );
}

function DealRow({ d, filter }: { d: Deal; filter: FilterKey }) {
  const idle = daysIdle(d);
  const low = d.marginPct < MARGIN_THRESHOLD;
  const stuck = idle > IDLE_THRESHOLD;
  return (
    <div className="rounded-md border border-border bg-card p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-medium">Сделка {d.id.toUpperCase()}</div>
        <div className="num text-[13px] font-semibold">{formatShort(d.amount)} ₽</div>
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5 num">
        маржа <span className={cn(low && "text-destructive")}>{d.marginPct}%</span>
        {" · "}без шага <span className={cn(stuck && "text-destructive")}>{idle > 0 ? `${idle} дн` : "—"}</span>
      </div>
      <div className="mt-1.5">
        <Badge className={filter === "payment" ? paymentStatusColor[d.paymentStatus] : zoneMeta[zoneOf(d)].bg + " " + zoneMeta[zoneOf(d)].border + " border"}>
          {filter === "payment" ? d.paymentStatus : zoneMeta[zoneOf(d)].short}
        </Badge>
      </div>
    </div>
  );
}

// ===== Desktop: подробная таблица (только desktop) =====

const stages = ["all", "Новый лид", "Контакт установлен", "Потребность выявлена", "КП отправлено", "Переговоры", "Счёт выставлен", "Выиграна", "Потеряна"];

function AllDealsTable() {
  const [manager, setManager] = useState("all");
  const [stage, setStage] = useState("all");
  const [risk, setRisk] = useState<"all" | FilterKey>("all");
  const [lowMargin, setLowMargin] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [payment, setPayment] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => allDeals.filter(d => {
    if (manager !== "all" && d.manager !== manager) return false;
    if (stage !== "all" && d.stage !== stage) return false;
    if (lowMargin && d.marginPct >= MARGIN_THRESHOLD) return false;
    if (stuck && daysIdle(d) <= IDLE_THRESHOLD) return false;
    if (payment && !isPaymentRisk(d)) return false;
    if (risk !== "all") {
      if (risk === "payment") {
        if (!isPaymentRisk(d)) return false;
      } else {
        if (CLOSED_STAGES.has(d.stage) || zoneOf(d) !== risk) return false;
      }
    }
    if (search && !d.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [manager, stage, risk, lowMargin, stuck, payment, search]);

  return (
    <div className="mt-3">
      <Card className="mb-3">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" /> Фильтры
        </div>
        <div className="grid grid-cols-6 gap-2">
          <input
            type="text" placeholder="Поиск по клиенту"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-card col-span-2"
          />
          <Select value={manager} onChange={setManager} options={[["all","Все менеджеры"], ...managers.map(m => [m.name, m.name] as [string, string])]} />
          <Select value={stage} onChange={setStage} options={stages.map(s => [s, s === "all" ? "Все стадии" : s])} />
          <Select value={risk} onChange={(v) => setRisk(v as "all" | FilterKey)} options={[
            ["all", "Все риски"],
            ["critical", "Критичная"],
            ["cheap", "Ниже маржи"],
            ["stuck", "Без движения"],
            ["payment", "Риск оплаты"],
          ]} />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={lowMargin} onChange={(e) => setLowMargin(e.target.checked)} />
              <span>Ниже маржи</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={stuck} onChange={(e) => setStuck(e.target.checked)} />
              <span>Без движения</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={payment} onChange={(e) => setPayment(e.target.checked)} />
              <span>Риск оплаты</span>
            </label>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-4 w-4" />}
          title="Нет сделок под выбранные фильтры"
          hint="Снимите часть фильтров или измените поиск по клиенту."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <Th>Клиент</Th><Th>Менеджер</Th><Th>Стадия</Th>
                  <Th right>Сумма</Th><Th right>Маржа %</Th>
                  <Th right>Без шага</Th><Th right>Просрочка</Th>
                  <Th right>Статус</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-2 font-medium">{d.client}</td>
                    <td className="py-2.5 px-2 text-[13px] text-muted-foreground">{d.manager}</td>
                    <td className="py-2.5 px-2 text-[13px] text-muted-foreground">{d.stage}</td>
                    <td className="py-2.5 px-2 text-right num">{formatShort(d.amount)}</td>
                    <td className={`py-2.5 px-2 text-right num ${d.marginPct < MARGIN_THRESHOLD ? "text-destructive font-semibold" : ""}`}>{d.marginPct}%</td>
                    <td className={`py-2.5 px-2 text-right num ${daysIdle(d) > IDLE_THRESHOLD ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{daysIdle(d) > 0 ? `${daysIdle(d)} дн` : "—"}</td>
                    <td className={`py-2.5 px-2 text-right num ${d.overdueDays > 0 ? "text-destructive" : "text-muted-foreground"}`}>{d.overdueDays > 0 ? `${d.overdueDays} дн` : "—"}</td>
                    <td className="py-2.5 px-2 text-right"><Badge className={paymentStatusColor[d.paymentStatus]}>{d.paymentStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`font-medium pb-2 px-2 whitespace-nowrap ${right ? "text-right" : ""}`}>{children}</th>;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="text-sm border border-border rounded-md px-3 py-1.5 bg-card w-full">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
