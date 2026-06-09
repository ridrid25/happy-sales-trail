import { Link } from "react-router-dom";
import { useState } from "react";
import {
  managers, redFlags, monthPlan, monthFact, monthForecast, planMargin, factMargin,
  planPayments, factPayments, totalReceivable, overdueReceivable, avgPaymentDays,
  forecastIncoming, deals, formatShort, riskColor, cashGap, avgQualityIndex,
  totalHoldingCost, avgOverdueDays, FINANCING_RATE, priorityActions,
} from "@/data/demo";
import { Card, PageHeader, Stat, Badge, ProgressBar } from "@/components/ui-bits";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertTriangle, TrendingUp, Wallet, Target, ShieldAlert, ArrowRight, ArrowRightCircle, ChevronDown, ListChecks } from "lucide-react";
import { RiskBlock } from "@/components/RiskBlock";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";

const lowMarginCount = deals.filter(d => d.marginPct < 15 && d.stage === "Выиграна").length;
const planPct = Math.round(monthFact / monthPlan * 100);
const forecastPct = Math.round(monthForecast / monthPlan * 100);

const severityCls = {
  high: "border-l-destructive bg-destructive/5 dark:bg-destructive/10 dark:border-destructive/30",
  medium: "border-l-warning bg-warning/5 dark:bg-warning/10 dark:border-warning/30",
};

const sortedByQuality = [...managers].sort((a, b) => b.qualityIndex - a.qualityIndex);

type Status = "норма" | "контроль" | "критично";

const storyline: { label: string; value: string; status: Status; meaning?: string }[] = [
  { label: "Продано", value: formatShort(monthFact) + " ₽", status: "контроль", meaning: `${planPct}% плана` },
  { label: "Маржа", value: "22,4%", status: "контроль", meaning: "ниже цели 25%" },
  { label: "Оплачено", value: formatShort(factPayments) + " ₽", status: "контроль", meaning: `${Math.round(factPayments/monthFact*100)}% выручки` },
  { label: "Дебиторка", value: formatShort(totalReceivable) + " ₽", status: "контроль", meaning: `срок ${avgPaymentDays} дн` },
  { label: "Просрочка", value: formatShort(overdueReceivable) + " ₽", status: "критично", meaning: `${avgOverdueDays} дн · ≈ ${formatShort(totalHoldingCost)} ₽` },
  { label: "Кассовый разрыв", value: "−" + formatShort(cashGap) + " ₽", status: "критично", meaning: "к концу месяца" },
];

export default function Dashboard() {
  const isMobile = useIsMobile();
  const paidPct = Math.round(factPayments / monthFact * 100);
  const unpaidPct = 100 - paidPct;

  return (
    <>
      <PageHeader
        title="Управленческий дашборд"
        subtitle="Качество продаж = выручка × маржа × оплаты. Май 2026"
      />

      {/* Управленческий вывод */}
      <Card className="mb-4 border-l-4 border-l-warning bg-warning/[0.03] dark:bg-warning/[0.06] dark:border-warning/30 dark:shadow-elevated">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-warning/15 text-warning flex items-center justify-center shrink-0 ring-1 ring-warning/30">
            <AlertTriangle className="h-[18px] w-[18px]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-warning/90 dark:text-warning font-semibold mb-1">Управленческий вывод</div>
            <p className="text-sm lg:text-[15px] text-foreground leading-relaxed">
              Выручка выглядит сильной — <span className="font-semibold">{planPct}% плана</span>, но <span className="font-semibold text-warning">качество продаж в зоне контроля</span>: <span className="font-semibold">{unpaidPct}%</span> продаж не оплачено, просроченная дебиторка <span className="num font-semibold text-destructive">{formatShort(overdueReceivable)} ₽</span> ({Math.round(overdueReceivable/totalReceivable*100)}% дебиторки), а прогноз поступлений ниже обязательных платежей на <span className="num font-semibold text-destructive">{formatShort(cashGap)} ₽</span>.
            </p>
          </div>
        </div>
      </Card>

      {isMobile ? <MobileView paidPct={paidPct} unpaidPct={unpaidPct} /> : <DesktopView paidPct={paidPct} unpaidPct={unpaidPct} />}
    </>
  );
}

/* ============== MOBILE ============== */

function MobileView({ paidPct, unpaidPct }: { paidPct: number; unpaidPct: number }) {
  return (
    <div className="space-y-3">
      {/* Compact storyline */}
      <Card className="bg-gradient-to-br from-header to-header/95 border-header text-white !p-0">
        <div className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-wider text-white/60">Связка качества продаж</div>
        <div className="divide-y divide-white/10">
          {storyline.map((s) => (
            <StoryRowMobile key={s.label} {...s} />
          ))}
        </div>
      </Card>

      {/* Главный финансовый блок — Деньги */}
      <MoneyHeroMobile paidPct={paidPct} unpaidPct={unpaidPct} />

      {/* Риски — управляемый блок */}
      <RiskBlock mobile />


      {/* Результат продаж — свернуто */}
      <CollapsibleSection
        icon={<Target className="h-4 w-4" />}
        title="Результат продаж"
        summary={`${planPct}% плана · прогноз ${forecastPct}%`}
      >
        <CompactRows
          rows={[
            { label: "План продаж", value: formatShort(monthPlan) + " ₽" },
            { label: "Факт продаж", value: `${formatShort(monthFact)} ₽ · ${planPct}%`, tone: planPct >= 95 ? "success" : "warning" },
            { label: "Прогноз до конца месяца", value: `${formatShort(monthForecast)} ₽ · ${forecastPct}%` },
            { label: "Индекс качества продаж", value: `${avgQualityIndex}/100`, tone: avgQualityIndex >= 75 ? "success" : avgQualityIndex >= 60 ? "warning" : "danger" },
          ]}
        />
      </CollapsibleSection>

      {/* Качество продаж — свернуто */}
      <CollapsibleSection
        icon={<TrendingUp className="h-4 w-4" />}
        title="Качество продаж"
        summary={`маржа 22,4% · ${lowMarginCount} низкомаржинальных`}
      >
        <CompactRows
          rows={[
            { label: "Валовая маржа", value: formatShort(factMargin) + " ₽" },
            { label: "План маржи", value: formatShort(planMargin) + " ₽" },
            { label: "Средняя маржинальность", value: "22,4%", tone: "warning" },
            { label: "Низкомаржинальные сделки", value: String(lowMarginCount), tone: "danger" },
            { label: "Сделки со скидкой", value: "9 из 22" },
            { label: "Ниже минимальной маржи", value: "5", tone: "danger" },
          ]}
        />
      </CollapsibleSection>

      {/* Менеджеры — компактный список */}
      <Card title="Менеджеры — качество" subtitle="Рейтинг по марже и оплатам">
        <div className="space-y-2 -mx-1">
          {sortedByQuality.map((m) => (
            <Link key={m.id} to={`/managers/${m.id}`} className="block px-1 py-1.5 rounded-md active:bg-muted/40">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-[13px] font-medium truncate">{m.name}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={riskColor[m.risk] + " text-[10px]"}>{m.risk}</Badge>
                  <div className="num text-[13px] font-semibold w-8 text-right">{m.qualityIndex}</div>
                </div>
              </div>
              <ProgressBar value={m.qualityIndex} tone={m.qualityIndex >= 75 ? "success" : m.qualityIndex >= 60 ? "warning" : "danger"} />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1 num">
                <span>{formatShort(m.fact)} ₽ · {Math.round(m.fact/m.plan*100)}% плана</span>
                <span>маржа {m.marginPct}% · просрочка {formatShort(m.overdue)} ₽</span>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/managers" className="mt-3 inline-flex items-center gap-1 text-sm text-accent">Все менеджеры <ArrowRight className="h-3.5 w-3.5" /></Link>
      </Card>
    </div>
  );
}

function StoryRowMobile({ label, value, status, meaning }: { label: string; value: string; status: Status; meaning?: string }) {
  const dot = { "норма": "bg-success", "контроль": "bg-warning", "критично": "bg-destructive" }[status];
  const statusText = { "норма": "text-success", "контроль": "text-warning", "критично": "text-destructive" }[status];
  const bg = status === "критично" ? "bg-destructive/15" : "";
  return (
    <div className={cn("flex items-center justify-between gap-3 px-4 py-2.5", bg)}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-white leading-tight">{label}</div>
          {meaning && <div className="text-[11px] text-white/60 leading-tight mt-0.5 truncate">{meaning}</div>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="num text-[14px] font-semibold text-white leading-tight">{value}</div>
        <div className={cn("text-[9.5px] uppercase tracking-wide font-semibold mt-0.5", statusText)}>{status}</div>
      </div>
    </div>
  );
}

function MoneyHeroMobile({ paidPct, unpaidPct }: { paidPct: number; unpaidPct: number }) {
  return (
    <Card className="border-l-4 border-l-accent">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-4 w-4 text-accent" />
        <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground/80">Деньги — главное</div>
      </div>

      {/* Paid/unpaid split bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
          <span>Оплачено <span className="num text-success font-semibold">{paidPct}%</span></span>
          <span>Не оплачено <span className="num text-warning font-semibold">{unpaidPct}%</span></span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden bg-muted flex">
          <div className="h-full bg-success" style={{ width: `${paidPct}%` }} />
          <div className="h-full bg-warning" style={{ width: `${unpaidPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <MiniStat label="Оплачено" value={formatShort(factPayments) + " ₽"} tone="success" />
        <MiniStat label="Не оплачено" value={formatShort(monthFact - factPayments) + " ₽"} tone="warning" />
        <MiniStat label="Дебиторка" value={formatShort(totalReceivable) + " ₽"} />
        <MiniStat label="Просроченная" value={formatShort(overdueReceivable) + " ₽"} tone="danger" />
        <MiniStat label="Стоимость просрочки" value={formatShort(totalHoldingCost) + " ₽"} tone="danger" hint={`${Math.round(FINANCING_RATE*100)}% год.`} />
        <MiniStat label="Кассовый разрыв" value={"−" + formatShort(cashGap) + " ₽"} tone="danger" />
      </div>

      <CompactRows
        rows={[
          { label: "Прогноз поступлений", value: formatShort(forecastIncoming) + " ₽", tone: "warning" },
          { label: "План поступлений", value: formatShort(planPayments) + " ₽" },
          { label: "Средний срок оплаты", value: avgPaymentDays + " дн", tone: "warning" },
        ]}
      />
    </Card>
  );
}

function MiniStat({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const toneCls = { default: "", success: "text-success", warning: "text-warning", danger: "text-destructive" }[tone];
  const bar = { default: "bg-border", success: "bg-success", warning: "bg-warning", danger: "bg-destructive" }[tone];
  return (
    <div className="relative rounded-md border border-border bg-background/40 dark:bg-background/30 px-2.5 py-2 overflow-hidden">
      <span className={cn("absolute left-0 top-0 bottom-0 w-0.5", bar, tone === "default" && "opacity-40")} />
      <div className="text-[10.5px] text-muted-foreground leading-tight">{label}</div>
      <div className={cn("num font-display font-semibold text-[14px] mt-0.5 leading-tight", toneCls)}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

function CompactRows({ rows }: { rows: { label: string; value: string; tone?: "default" | "success" | "warning" | "danger" }[] }) {
  return (
    <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
      {rows.map((r, i) => {
        const toneCls = { default: "text-foreground", success: "text-success", warning: "text-warning", danger: "text-destructive" }[r.tone || "default"];
        return (
          <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 bg-card">
            <div className="text-[12.5px] text-muted-foreground">{r.label}</div>
            <div className={cn("num text-[13px] font-semibold text-right", toneCls)}>{r.value}</div>
          </div>
        );
      })}
    </div>
  );
}

function CollapsibleSection({
  title, icon, summary, children, defaultOpen = false,
}: { title: string; icon: React.ReactNode; summary?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 active:bg-muted/40"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-accent shrink-0">{icon}</span>
          <div className="min-w-0 text-left">
            <div className="text-[13px] font-semibold leading-tight">{title}</div>
            {summary && <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{summary}</div>}
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function RedFlagRow({ flag }: { flag: typeof redFlags[number] }) {
  const [open, setOpen] = useState(false);
  const sev = flag.severity === "high" ? "border-l-destructive bg-destructive/[0.04] dark:bg-destructive/10" : "border-l-warning bg-warning/[0.04] dark:bg-warning/10";
  return (
    <div className={cn("border-l-2 rounded-r-md px-3 py-2", sev)}>
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[12.5px] font-semibold leading-snug">{flag.title}</div>
          <Badge className={flag.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/30 shrink-0 text-[10px]" : "bg-warning/10 text-warning border-warning/30 shrink-0 text-[10px]"}>
            {flag.severity === "high" ? "Выс." : "Сред."}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground mt-0.5">
          <span className="truncate">{flag.who || flag.area}</span>
          {flag.amount && <span className="num font-medium text-foreground shrink-0">{flag.amount}</span>}
        </div>
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-border/60 text-[11.5px] space-y-1">
          <div><span className="text-muted-foreground">Область: </span>{flag.area}</div>
          <div className="flex items-start gap-1.5">
            <ArrowRightCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <span>{flag.action}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============== DESKTOP (original) ============== */

function DesktopView({ paidPct, unpaidPct }: { paidPct: number; unpaidPct: number }) {
  return (
    <>
      <Card className="mb-6 bg-gradient-to-r from-header to-header/95 border-header text-white">
        <div className="text-[11px] uppercase tracking-wider text-white/60 mb-3">Связка качества продаж</div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 items-stretch">
          {storyline.map(s => <StoryStep key={s.label} {...s} />)}
        </div>
      </Card>

      <div className="space-y-6">
        <section>
          <SectionTitle icon={<Target className="h-4 w-4" />} title="Результат продаж" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            <Stat label="План продаж" value={formatShort(monthPlan) + " ₽"} hint="на месяц" />
            <Stat label="Факт продаж" value={formatShort(monthFact) + " ₽"} hint={`${planPct}% плана`} tone={planPct >= 95 ? "success" : "warning"} />
            <Stat label="Выполнение плана" value={planPct + "%"} hint={<ProgressBar value={planPct} tone={planPct >= 95 ? "success" : "warning"} />} />
            <Stat label="Прогноз до конца" value={formatShort(monthForecast) + " ₽"} hint={`${forecastPct}% плана`} />
            <Stat label="Индекс качества продаж" value={avgQualityIndex + "/100"} tone={avgQualityIndex >= 75 ? "success" : avgQualityIndex >= 60 ? "warning" : "danger"} hint="средний по команде" />
          </div>
        </section>

        <section>
          <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Качество продаж" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            <Stat label="Валовая маржа" value={formatShort(factMargin) + " ₽"} hint={`план ${formatShort(planMargin)} ₽`} />
            <Stat label="Средняя маржинальность" value="22,4%" hint="цель 25%" tone="warning" />
            <Stat label="Низкомаржинальные" value={lowMarginCount} hint="<15% маржи" tone="danger" />
            <Stat label="Сделки со скидкой" value="9" hint="из 22 выигранных" />
            <Stat label="Ниже мин. маржи" value="5" tone="danger" hint="проверить причины скидок" />
          </div>
        </section>

        <section>
          <SectionTitle icon={<Wallet className="h-4 w-4" />} title="Деньги" />
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mt-3">
            <Stat label="Оплаченная выручка" value={formatShort(factPayments) + " ₽"} tone="success" />
            <Stat label="Неоплаченная" value={formatShort(monthFact - factPayments) + " ₽"} tone="warning" />
            <Stat label="Дебиторка" value={formatShort(totalReceivable) + " ₽"} />
            <Stat label="Просроченная" value={formatShort(overdueReceivable) + " ₽"} tone="danger" hint={`${Math.round(overdueReceivable/totalReceivable*100)}% от дебиторки`} />
            <Stat label="Стоимость просрочки" value={formatShort(totalHoldingCost) + " ₽"} tone="danger" hint={`по ставке ${Math.round(FINANCING_RATE*100)}% годовых`} />
            <Stat label="Срок оплаты" value={avgPaymentDays + " дн"} hint="средний" tone="warning" />
            <Stat label="Прогноз поступлений" value={formatShort(forecastIncoming) + " ₽"} hint={`план ${formatShort(planPayments)} ₽`} tone="warning" />
          </div>
        </section>

        <section>
          <SectionTitle icon={<ShieldAlert className="h-4 w-4" />} title="Риски" />
          <div className="mt-3">
            <RiskBlock />
          </div>
        </section>


        <div className="grid lg:grid-cols-3 gap-4">
          <Card title="План · Факт · Оплаты" subtitle="по неделям месяца" className="lg:col-span-2">
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { p: "Нед 1", plan: 7, fact: 6.2, paid: 4.8 },
                  { p: "Нед 2", plan: 7, fact: 6.4, paid: 5.1 },
                  { p: "Нед 3", plan: 7, fact: 6.1, paid: 4.3 },
                  { p: "Нед 4", plan: 7, fact: 5.65, paid: 3.0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="p" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit=" млн" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="plan" name="План" fill="hsl(var(--border))" radius={[4,4,0,0]} />
                  <Bar dataKey="fact" name="Факт" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
                  <Bar dataKey="paid" name="Оплачено" fill="hsl(var(--success))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Индекс качества продаж" subtitle="Сортировка по качеству, не выручке">
            <div className="space-y-3">
              {sortedByQuality.map((m) => (
                <Link key={m.id} to={`/managers/${m.id}`} className="block hover:bg-muted/40 -mx-2 px-2 py-1.5 rounded-md transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="num text-sm font-semibold">{m.qualityIndex}</div>
                  </div>
                  <ProgressBar value={m.qualityIndex} tone={m.qualityIndex >= 75 ? "success" : m.qualityIndex >= 60 ? "warning" : "danger"} />
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <Card
          title="Менеджеры — качество продаж"
          subtitle="Управленческий рейтинг по марже и оплатам, а не по выручке"
          action={<Link to="/managers" className="text-sm text-accent hover:underline flex items-center gap-1">Все менеджеры <ArrowRight className="h-3.5 w-3.5" /></Link>}
        >
          <div className="overflow-x-auto -mx-5 px-5 scrollbar-thin">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="font-medium pb-2">Менеджер</th>
                  <th className="font-medium pb-2 text-right">Факт</th>
                  <th className="font-medium pb-2 text-right">% плана</th>
                  <th className="font-medium pb-2 text-right">Маржа</th>
                  <th className="font-medium pb-2 text-right">Просрочка</th>
                  <th className="font-medium pb-2 text-right">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedByQuality.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="py-3">
                      <Link to={`/managers/${m.id}`} className="font-medium hover:text-accent">{m.name}</Link>
                      <div className="text-[11px] text-muted-foreground">{m.title}</div>
                    </td>
                    <td className="py-3 text-right num">{formatShort(m.fact)} ₽</td>
                    <td className="py-3 text-right num">{Math.round(m.fact / m.plan * 100)}%</td>
                    <td className="py-3 text-right num">{m.marginPct}%</td>
                    <td className="py-3 text-right num text-destructive">{formatShort(m.overdue)} ₽</td>
                    <td className="py-3 text-right"><Badge className={riskColor[m.risk]}>{m.risk}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
      <span className="text-accent">{icon}</span>
      <span className="uppercase tracking-wide text-xs">{title}</span>
    </div>
  );
}

function StoryStep({ label, value, meaning, status }: { label: string; value: string; meaning?: string; status: Status }) {
  const dot = { "норма": "bg-success", "контроль": "bg-warning", "критично": "bg-destructive" }[status];
  const statusText = { "норма": "text-success", "контроль": "text-warning", "критично": "text-destructive" }[status];
  const wrap =
    status === "критично"
      ? "bg-destructive/15 border-destructive/40 ring-1 ring-destructive/30"
      : status === "контроль"
      ? "bg-warning/10 border-warning/30"
      : "bg-white/[0.06] border-white/15";
  return (
    <div className={`relative px-3 py-2.5 rounded-md border ${wrap} shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset]`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="text-[10px] uppercase tracking-wider text-white/70 font-medium">{label}</div>
        <div className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className={`text-[9px] uppercase tracking-wide font-semibold ${statusText}`}>{status}</span>
        </div>
      </div>
      <div className="font-display font-bold text-lg lg:text-xl num leading-tight text-white">{value}</div>
      {meaning && <div className="text-[10.5px] text-white/70 mt-1 leading-snug">{meaning}</div>}
    </div>
  );
}
