import { Link } from "react-router-dom";
import { managers, formatShort, riskColor, type Manager } from "@/data/demo";
import { Card, PageHeader, Badge, ProgressBar } from "@/components/ui-bits";
import { useMemo, useState } from "react";
import {
  ChevronDown, ChevronRight, Search, Star, AlertTriangle,
  TrendingDown, Clock, PauseCircle, ShieldAlert, Users, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============== Управленческие пороги ==============
const MIN_MARGIN_PCT = 20;          // минимальная допустимая маржа
const HIGH_OVERDUE = 500_000;       // высокая просрочка по менеджеру
const SLOW_PAYMENT_DAYS = 35;       // плохой срок оплаты
const QUALITY_GOOD = 75;
const QUALITY_OK = 60;

type SegmentKey =
  | "stars"           // Звёзды качества
  | "volumeNoMoney"   // Объём без денег
  | "soldCheap"       // Продали дёшево
  | "paymentRisk"     // Риск по оплатам
  | "weak";           // Слабая зона

const SEGMENTS: Record<SegmentKey, { title: string; symptom: string; action: string; tone: string; icon: any }> = {
  stars:         { title: "Звёзды качества",  symptom: "продают много, маржа в норме, оплаты в срок", action: "масштабировать практики и закрепить условия",  tone: "text-success",     icon: Star },
  volumeNoMoney: { title: "Объём без денег",  symptom: "продажи есть, денег нет",                      action: "ограничить отсрочки и разобрать топ-долги",   tone: "text-destructive", icon: AlertTriangle },
  soldCheap:     { title: "Продали дёшево",    symptom: "сделки ниже минимальной маржи, скидки съедают прибыль", action: "проверить скидки и условия по новым сделкам", tone: "text-warning",     icon: TrendingDown },
  paymentRisk:   { title: "Риск по оплатам",   symptom: "клиенты часто задерживают оплату",            action: "пересмотреть отсрочки, усилить контроль оплат", tone: "text-warning",     icon: Clock },
  weak:          { title: "Слабая зона",       symptom: "мало продаж и низкое качество",               action: "разобрать план, обучение или пересмотр роли", tone: "text-muted-foreground", icon: PauseCircle },
};

// Один менеджер — один первичный сегмент (по приоритету риска)
function classify(m: Manager, median: number): SegmentKey {
  const paidRatio = m.paid / Math.max(m.fact, 1);
  const isHighVolume = m.fact >= median;

  if (isHighVolume && (m.overdue >= HIGH_OVERDUE || paidRatio < 0.7)) return "volumeNoMoney";
  if (m.marginPct < MIN_MARGIN_PCT || m.lowMarginDeals >= 2) return "soldCheap";
  if (m.avgPaymentDays > SLOW_PAYMENT_DAYS || m.overdue >= HIGH_OVERDUE) return "paymentRisk";
  if (isHighVolume && m.qualityIndex >= QUALITY_GOOD) return "stars";
  if (m.qualityIndex < QUALITY_OK && !isHighVolume) return "weak";
  return m.qualityIndex >= QUALITY_GOOD ? "stars" : "weak";
}

// Квадрант матрицы «Объём × Качество»
type Quadrant = "stars" | "danger" | "potential" | "weak";
function quadrant(m: Manager, median: number): Quadrant {
  const highVol = m.fact >= median;
  const highQ = m.qualityIndex >= QUALITY_OK;
  if (highVol && highQ) return "stars";
  if (highVol && !highQ) return "danger";
  if (!highVol && highQ) return "potential";
  return "weak";
}

const QUADRANTS: Record<Quadrant, { title: string; hint: string; tone: string; border: string }> = {
  stars:     { title: "Звёзды качества",       hint: "Высокий объём + высокое качество",  tone: "text-success",     border: "border-success/40" },
  danger:    { title: "Опасный объём",          hint: "Высокий объём + низкое качество",   tone: "text-destructive", border: "border-destructive/40" },
  potential: { title: "Качественный потенциал", hint: "Низкий объём + высокое качество",   tone: "text-accent",      border: "border-accent/40" },
  weak:      { title: "Слабая зона",            hint: "Низкий объём + низкое качество",    tone: "text-muted-foreground", border: "border-border" },
};

export default function Managers() {
  // Медиана выручки — порог «высокого объёма»
  const median = useMemo(() => {
    const arr = [...managers].map(m => m.fact).sort((a, b) => a - b);
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  }, []);

  const enriched = useMemo(() => managers.map(m => ({
    ...m,
    segment: classify(m, median),
    quadrant: quadrant(m, median),
    paidRatio: m.paid / Math.max(m.fact, 1),
    marginLoss: m.marginPct < MIN_MARGIN_PCT
      ? Math.round((MIN_MARGIN_PCT - m.marginPct) / 100 * m.fact)
      : 0,
    paymentsGap: Math.max(0, m.fact - m.paid),
  })), [median]);

  // ============== Сводка команды ==============
  const summary = useMemo(() => {
    const total = enriched.length;
    const norm = enriched.filter(m => m.risk === "норма").length;
    const ctrl = enriched.filter(m => m.risk === "контроль").length;
    const crit = enriched.filter(m => m.risk === "критично").length;
    const lowMargin = enriched.filter(m => m.marginPct < MIN_MARGIN_PCT).length;
    const highOverdue = enriched.filter(m => m.overdue >= HIGH_OVERDUE).length;
    const marginLoss = enriched.reduce((s, m) => s + m.marginLoss, 0);
    const totalOverdue = enriched.reduce((s, m) => s + m.overdue, 0);
    // менеджеры, формирующие 70%+ просрочки
    const sortedByOverdue = [...enriched].sort((a, b) => b.overdue - a.overdue);
    let acc = 0; let topCount = 0;
    for (const m of sortedByOverdue) { acc += m.overdue; topCount++; if (totalOverdue && acc / totalOverdue >= 0.7) break; }
    const topShare = totalOverdue ? Math.round(acc / totalOverdue * 100) : 0;
    return { total, norm, ctrl, crit, lowMargin, highOverdue, marginLoss, totalOverdue, topCount, topShare };
  }, [enriched]);

  // ============== Полный список — поиск/фильтры ==============
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fSegment, setFSegment] = useState<string>("all");
  const [fLowMargin, setFLowMargin] = useState(false);
  const [fOverdue, setFOverdue] = useState(false);

  const filtered = enriched.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (fStatus !== "all" && m.risk !== fStatus) return false;
    if (fSegment !== "all" && m.segment !== fSegment) return false;
    if (fLowMargin && m.marginPct >= MIN_MARGIN_PCT) return false;
    if (fOverdue && m.overdue < HIGH_OVERDUE) return false;
    return true;
  });

  // ============== Топ-5 для разбора ==============
  const topMarginLoss = [...enriched].filter(m => m.marginLoss > 0).sort((a, b) => b.marginLoss - a.marginLoss).slice(0, 5);
  const topOverdue    = [...enriched].filter(m => m.overdue > 0).sort((a, b) => b.overdue - a.overdue).slice(0, 5);
  const topLowMargin  = [...enriched].filter(m => m.lowMarginDeals > 0).sort((a, b) => b.lowMarginDeals - a.lowMarginDeals).slice(0, 5);
  const topGap        = [...enriched].filter(m => m.paymentsGap > 0).sort((a, b) => b.paymentsGap - a.paymentsGap).slice(0, 5);

  const [topTab, setTopTab] = useState<"loss" | "overdue" | "low" | "gap">("loss");
  const topMap = { loss: topMarginLoss, overdue: topOverdue, low: topLowMargin, gap: topGap };
  const topMeta: Record<typeof topTab, { label: string; problem: (m: typeof enriched[number]) => string; sum: (m: typeof enriched[number]) => string; cause: (m: typeof enriched[number]) => string; action: string }> = {
    loss:    { label: "Потеря маржи",     problem: () => "Продал ниже маржи",        sum: m => `Потеря маржи: ${formatShort(m.marginLoss)} ₽`, cause: m => `Маржа ${m.marginPct}% при пороге ${MIN_MARGIN_PCT}%`, action: "проверить скидки" },
    overdue: { label: "Просрочка",        problem: () => "Высокая просроченная дебиторка", sum: m => `Просрочка: ${formatShort(m.overdue)} ₽`,    cause: m => `Срок оплаты ${m.avgPaymentDays} дн`,             action: "разобрать топ-долги" },
    low:     { label: "Сделки ниже маржи", problem: () => "Сделки ниже порога маржи",  sum: m => `${m.lowMarginDeals} сделок`,                  cause: () => "скидки/слабые условия",                       action: "проверить условия" },
    gap:     { label: "Продажи vs деньги", problem: () => "Большой разрыв продаж и оплат", sum: m => `Разрыв: ${formatShort(m.paymentsGap)} ₽`,    cause: m => `Оплачено ${Math.round(m.paidRatio * 100)}% от выручки`, action: "ускорить взыскание" },
  };

  // ============== Сегменты ==============
  const segGroups = (Object.keys(SEGMENTS) as SegmentKey[]).map(key => {
    const items = enriched.filter(m => m.segment === key);
    return {
      key,
      items,
      sales: items.reduce((s, m) => s + m.fact, 0),
      overdue: items.reduce((s, m) => s + m.overdue, 0),
      marginLoss: items.reduce((s, m) => s + m.marginLoss, 0),
    };
  });

  return (
    <>
      <PageHeader
        back={{ to: "/", label: "Дашборд" }}
        title="Качество продаж по менеджерам"
        subtitle="Кто создаёт риск по марже и деньгам — и кого разобрать первым"
      />

      {/* 1. Сводка команды */}
      <section className="mb-5">
        <h2 className="font-display text-base lg:text-lg font-semibold mb-3">Сводка команды</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          <SummaryTile label="Всего менеджеров" value={summary.total} />
          <SummaryTile label="В норме" value={summary.norm} tone="success" />
          <SummaryTile label="Зона контроля" value={summary.ctrl} tone="warning" />
          <SummaryTile label="Критичная зона" value={summary.crit} tone="danger" />
          <SummaryTile label="Ниже минимальной маржи" value={summary.lowMargin} hint={`порог ${MIN_MARGIN_PCT}%`} tone="warning" />
          <SummaryTile label="Высокая просрочка" value={summary.highOverdue} hint={`≥ ${formatShort(HIGH_OVERDUE)} ₽`} tone="danger" />
          <SummaryTile label="Потери маржи" value={`${formatShort(summary.marginLoss)} ₽`} hint="из-за сделок ниже порога" tone="danger" />
          <SummaryTile
            label="Формируют просрочку"
            value={`${summary.topCount} из ${summary.total}`}
            hint={`${summary.topShare}% всей просрочки`}
            tone="danger"
          />
        </div>
      </section>

      {/* 2. Матрица Объём × Качество */}
      <section className="mb-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-base lg:text-lg font-semibold">Матрица «Объём × Качество»</h2>
          <span className="text-[11px] text-muted-foreground">порог объёма: {formatShort(median)} ₽</span>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          {(["stars", "potential", "danger", "weak"] as Quadrant[]).map(q => {
            const items = enriched.filter(m => m.quadrant === q);
            const sales = items.reduce((s, m) => s + m.fact, 0);
            const margin = items.reduce((s, m) => s + m.margin, 0);
            const overdue = items.reduce((s, m) => s + m.overdue, 0);
            const meta = QUADRANTS[q];
            return (
              <div key={q} className={cn("bg-card rounded-lg border-2 p-3 lg:p-4 shadow-card", meta.border)}>
                <div className={cn("font-display font-semibold text-sm lg:text-base", meta.tone)}>{meta.title}</div>
                <div className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 leading-tight">{meta.hint}</div>
                <div className="mt-2 num font-display text-2xl font-semibold">{items.length}</div>
                <div className="text-[11px] text-muted-foreground">менеджеров</div>
                <div className="mt-2 space-y-0.5 text-[11px] lg:text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Выручка</span><span className="num">{formatShort(sales)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Маржа</span><span className="num">{formatShort(margin)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Просрочка</span><span className={cn("num", overdue > 0 && "text-destructive")}>{formatShort(overdue)}</span></div>
                </div>
                {items.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
                    {items.slice(0, 2).map(m => (
                      <Link key={m.id} to={`/managers/${m.id}`} className="block text-[11px] lg:text-xs hover:text-accent truncate">
                        {m.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Сегменты команды */}
      <section className="mb-5">
        <h2 className="font-display text-base lg:text-lg font-semibold mb-3">Сегменты команды</h2>
        <div className="grid gap-2 lg:gap-3 lg:grid-cols-2">
          {segGroups.filter(g => g.items.length > 0).map(g => {
            const meta = SEGMENTS[g.key];
            const Icon = meta.icon;
            return (
              <div key={g.key} className="bg-card rounded-lg border border-border shadow-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={cn("h-4 w-4 shrink-0", meta.tone)} />
                    <div className="font-display font-semibold truncate">{meta.title}</div>
                  </div>
                  <Badge className="bg-muted/60 text-foreground border-border shrink-0">{g.items.length}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] lg:text-xs">
                  <Mini label="Выручка" value={`${formatShort(g.sales)} ₽`} />
                  <Mini label="Просрочка" value={`${formatShort(g.overdue)} ₽`} danger={g.overdue > 0} />
                  <Mini label="Потери маржи" value={`${formatShort(g.marginLoss)} ₽`} danger={g.marginLoss > 0} />
                </div>
                <div className="mt-2 text-xs"><span className="text-muted-foreground">Симптом: </span>{meta.symptom}</div>
                <div className="text-xs"><span className="text-muted-foreground">Действие: </span>{meta.action}</div>
                <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap gap-x-3 gap-y-1">
                  {g.items.map(m => (
                    <Link key={m.id} to={`/managers/${m.id}`} className="text-xs hover:text-accent">
                      {m.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Топ-5 для разбора */}
      <section className="mb-5">
        <h2 className="font-display text-base lg:text-lg font-semibold mb-3">Топ-5 для разбора</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(Object.keys(topMeta) as (keyof typeof topMeta)[]).map(k => (
            <button
              key={k}
              onClick={() => setTopTab(k)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs border transition-colors",
                topTab === k ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border hover:bg-muted/40"
              )}
            >
              {topMeta[k].label}
            </button>
          ))}
        </div>
        <div className="bg-card rounded-lg border border-border shadow-card divide-y divide-border">
          {topMap[topTab].length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Нет менеджеров по этому критерию.</div>
          ) : topMap[topTab].map((m, i) => {
            const meta = topMeta[topTab];
            return (
              <Link key={m.id} to={`/managers/${m.id}`} className="flex items-start gap-3 p-3 lg:p-4 hover:bg-muted/30">
                <div className="text-xs text-muted-foreground num w-5 pt-0.5">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{m.name}</div>
                    <Badge className={riskColor[m.risk]}>{m.risk}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{meta.problem(m)}</div>
                  <div className="text-sm num mt-1 font-semibold">{meta.sum(m)}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Причина: {meta.cause(m)} · Действие: {meta.action}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Взаимосвязи */}
      <section className="mb-5">
        <h2 className="font-display text-base lg:text-lg font-semibold mb-3">Взаимосвязи показателей</h2>
        <div className="grid gap-2 lg:gap-3 lg:grid-cols-2">
          <RelationCard
            icon={<TrendingDown className="h-4 w-4 text-warning" />}
            title="Выручка vs маржа"
            insight={`${summary.lowMargin} менеджеров продают ниже порога маржи ${MIN_MARGIN_PCT}%`}
            people={enriched.filter(m => m.marginPct < MIN_MARGIN_PCT).slice(0, 3)}
            action="ограничить скидки ниже минимальной маржи"
          />
          <RelationCard
            icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
            title="Выручка vs оплаченная выручка"
            insight="Высокие продажи не всегда превращаются в деньги"
            people={[...enriched].sort((a, b) => b.paymentsGap - a.paymentsGap).slice(0, 3)}
            action="перевести часть сделок на предоплату"
          />
          <RelationCard
            icon={<Clock className="h-4 w-4 text-warning" />}
            title="Дебиторка vs просрочка"
            insight="Долг уже стал проблемой у этих менеджеров"
            people={[...enriched].filter(m => m.overdue > 0).sort((a, b) => b.overdue - a.overdue).slice(0, 3)}
            action="разобрать топ-долги вручную"
          />
          <RelationCard
            icon={<AlertTriangle className="h-4 w-4 text-warning" />}
            title="Скидки vs потери маржи"
            insight={`Сделки ниже порога съедают ${formatShort(summary.marginLoss)} ₽ маржи`}
            people={[...enriched].filter(m => m.lowMarginDeals > 0).sort((a, b) => b.lowMarginDeals - a.lowMarginDeals).slice(0, 3)}
            action="проверить условия скидок"
          />
        </div>
      </section>

      {/* 6. Полный список менеджеров */}
      <section className="mb-5">
        <button
          onClick={() => setShowAll(s => !s)}
          className="w-full flex items-center justify-between gap-3 bg-card rounded-lg border border-border shadow-card px-4 py-3 hover:bg-muted/30 transition-colors lg:hidden"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-display font-semibold">Все менеджеры</span>
            <Badge className="bg-muted/60 text-foreground border-border">{enriched.length}</Badge>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")} />
        </button>

        <div className="hidden lg:flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">Полный список менеджеров</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} из {enriched.length}</span>
        </div>

        <div className={cn("mt-3 lg:mt-0", !showAll && "hidden lg:block")}>
          {/* Поиск и фильтры */}
          <div className="bg-card rounded-lg border border-border shadow-card p-3 lg:p-4 mb-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по имени"
                className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="text-sm bg-background border border-border rounded-md px-2 py-2">
                <option value="all">Все статусы</option>
                <option value="норма">Норма</option>
                <option value="контроль">Контроль</option>
                <option value="критично">Критично</option>
              </select>
              <select value={fSegment} onChange={e => setFSegment(e.target.value)} className="text-sm bg-background border border-border rounded-md px-2 py-2">
                <option value="all">Все сегменты</option>
                {(Object.keys(SEGMENTS) as SegmentKey[]).map(k => (
                  <option key={k} value={k}>{SEGMENTS[k].title}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <FilterChip active={fLowMargin} onClick={() => setFLowMargin(v => !v)}>Ниже маржи</FilterChip>
              <FilterChip active={fOverdue} onClick={() => setFOverdue(v => !v)}>Высокая просрочка</FilterChip>
            </div>
          </div>

          {/* Карточки mobile */}
          <div className="grid gap-2 lg:hidden">
            {filtered.map(m => (
              <Link key={m.id} to={`/managers/${m.id}`} className="bg-card rounded-lg border border-border p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-semibold truncate">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{SEGMENTS[m.segment].title}</div>
                  </div>
                  <Badge className={riskColor[m.risk]}>{m.risk}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <Mini label="Выручка" value={formatShort(m.fact)} />
                  <Mini label="Маржа" value={`${m.marginPct}%`} danger={m.marginPct < MIN_MARGIN_PCT} />
                  <Mini label="Просрочка" value={formatShort(m.overdue)} danger={m.overdue >= HIGH_OVERDUE} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1"><ProgressBar value={m.qualityIndex} tone={m.qualityIndex >= QUALITY_GOOD ? "success" : m.qualityIndex >= QUALITY_OK ? "warning" : "danger"} /></div>
                  <div className="text-[11px] num text-muted-foreground">{m.qualityIndex}/100</div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center bg-card border border-dashed border-border rounded-lg">
                Никого не нашли по фильтрам.
              </div>
            )}
          </div>

          {/* Таблица desktop */}
          <Card className="hidden lg:block">
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                    <Th>Менеджер</Th>
                    <Th>Сегмент</Th>
                    <Th right>Выручка</Th>
                    <Th right>Маржа %</Th>
                    <Th right>Оплачено</Th>
                    <Th right>Дебиторка</Th>
                    <Th right>Просрочка</Th>
                    <Th right>Потеря маржи</Th>
                    <Th right>Индекс качества</Th>
                    <Th right>Статус</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(m => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="py-3 pr-4">
                        <Link to={`/managers/${m.id}`} className="font-medium hover:text-accent">{m.name}</Link>
                        <div className="text-[11px] text-muted-foreground">{m.title}</div>
                      </td>
                      <td className="py-3 px-2 text-xs">{SEGMENTS[m.segment].title}</td>
                      <Td>{formatShort(m.fact)}</Td>
                      <Td className={m.marginPct < MIN_MARGIN_PCT ? "text-destructive" : ""}>{m.marginPct}%</Td>
                      <Td>{formatShort(m.paid)}</Td>
                      <Td>{formatShort(m.receivable)}</Td>
                      <Td className={m.overdue >= HIGH_OVERDUE ? "text-destructive font-medium" : m.overdue > 0 ? "text-warning" : ""}>{formatShort(m.overdue)}</Td>
                      <Td className={m.marginLoss > 0 ? "text-destructive" : ""}>{m.marginLoss > 0 ? formatShort(m.marginLoss) : "—"}</Td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="num font-semibold">{m.qualityIndex}</span>
                          <div className="w-16"><ProgressBar value={m.qualityIndex} tone={m.qualityIndex >= QUALITY_GOOD ? "success" : m.qualityIndex >= QUALITY_OK ? "warning" : "danger"} /></div>
                        </div>
                      </td>
                      <td className="py-3 pl-2 text-right"><Badge className={riskColor[m.risk]}>{m.risk}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

// ============== Вспомогательные ==============
function SummaryTile({ label, value, hint, tone = "default" }: {
  label: string; value: React.ReactNode; hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneCls = { default: "", success: "text-success", warning: "text-warning", danger: "text-destructive" }[tone];
  return (
    <div className="bg-card rounded-lg border border-border p-3 lg:p-4 shadow-card">
      <div className="text-[11px] lg:text-xs text-muted-foreground leading-tight">{label}</div>
      <div className={cn("font-display font-semibold text-lg lg:text-xl num mt-1", toneCls)}>{value}</div>
      {hint && <div className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 leading-tight">{hint}</div>}
    </div>
  );
}

function Mini({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
      <div className={cn("num font-semibold", danger && "text-destructive")}>{value}</div>
    </div>
  );
}

function RelationCard({ icon, title, insight, people, action }: {
  icon: React.ReactNode; title: string; insight: string;
  people: { id: string; name: string }[]; action: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <div className="font-display font-semibold">{title}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{insight}</div>
      {people.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {people.map(p => (
            <Link key={p.id} to={`/managers/${p.id}`} className="text-xs hover:text-accent">{p.name}</Link>
          ))}
        </div>
      )}
      <div className="text-xs mt-2 flex items-center gap-1 text-accent">
        <ArrowRight className="h-3 w-3" /> {action}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md text-xs border transition-colors",
        active ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border hover:bg-muted/40"
      )}
    >
      {children}
    </button>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`font-medium pb-2 px-2 ${right ? "text-right" : ""}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 px-2 text-right num ${className}`}>{children}</td>;
}
