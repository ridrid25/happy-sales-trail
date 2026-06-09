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
        subtitle={isMobile ? "Май 2026 · Выручка × маржа × оплаты" : "Качество продаж = выручка × маржа × оплаты. Май 2026"}
      />


      {/* Управленческий вывод / Статус */}
      <div id="section-status" className="scroll-mt-32">
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
      </div>

      {isMobile ? <MobileView paidPct={paidPct} unpaidPct={unpaidPct} /> : <DesktopView paidPct={paidPct} unpaidPct={unpaidPct} />}
    </>
  );
}

/* ============== MOBILE ============== */

function MobileView({ paidPct, unpaidPct }: { paidPct: number; unpaidPct: number }) {
  const unpaid = monthFact - factPayments;
  return (
    <div className="space-y-3">
      {/* 1. Деньги — компактные строки */}
      <div id="section-money" className="scroll-mt-32">
      <Card className="!p-0 overflow-hidden border-l-4 border-l-accent">

        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Wallet className="h-4 w-4 text-accent" />
          <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground/80">Деньги</div>
          <div className="ml-auto text-[11px] text-muted-foreground">
            оплачено <span className="num text-success font-semibold">{paidPct}%</span> · не оплачено <span className="num text-warning font-semibold">{unpaidPct}%</span>
          </div>
        </div>
        <div className="px-4 pb-2">
          <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted flex">
            <div className="h-full bg-success" style={{ width: `${paidPct}%` }} />
            <div className="h-full bg-warning" style={{ width: `${unpaidPct}%` }} />
          </div>
        </div>
        <div className="divide-y divide-border border-t border-border">
          <MoneyRow label="Продано" value={formatShort(monthFact) + " ₽"} hint={`${planPct}% плана`} />
          <MoneyRow label="Оплачено" value={formatShort(factPayments) + " ₽"} tone="success" />
          <MoneyRow label="Не оплачено" value={formatShort(unpaid) + " ₽"} tone="warning" />
          <MoneyRow label="Дебиторка" value={formatShort(totalReceivable) + " ₽"} hint={`срок ${avgPaymentDays} дн`} />
          <MoneyRow label="Просрочка" value={formatShort(overdueReceivable) + " ₽"} tone="danger" hint={`${avgOverdueDays} дн · ${Math.round(overdueReceivable/totalReceivable*100)}% дебиторки`} />
          <MoneyRow label="Стоимость просрочки" value={formatShort(totalHoldingCost) + " ₽"} tone="danger" hint={`${Math.round(FINANCING_RATE*100)}% годовых`} />
          <MoneyRow label="Кассовый разрыв" value={"−" + formatShort(cashGap) + " ₽"} tone="danger" hint="к концу месяца" />
        </div>
      </Card>
      </div>


      {/* 2. Что сделать сегодня */}
      <div id="section-actions" className="scroll-mt-32">
        <TodayActionsMobile />
      </div>

      {/* 3. Риски — компактный блок */}
      <div id="section-risks" className="scroll-mt-32">
        <RiskBlock mobile />
      </div>


      {/* 4. Результат продаж */}
      <CollapsibleSection
        defaultOpen
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

      {/* 5. Качество продаж */}
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

      {/* 6. Менеджеры */}
      <CollapsibleSection
        icon={<TrendingUp className="h-4 w-4" />}
        title="Менеджеры — качество"
        summary={`топ ${sortedByQuality[0]?.name?.split(" ")[0] ?? "—"} · ${managers.length} чел.`}
      >
        <div className="space-y-2">
          {sortedByQuality.map((m) => (
            <Link key={m.id} to={`/managers/${m.id}`} className="block py-1.5 px-1 rounded-md active:bg-muted/40">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-[13px] font-medium truncate">{m.name}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={riskColor[m.risk] + " text-[10px]"}>{m.risk}</Badge>
                  <div className="num text-[13px] font-semibold w-8 text-right">{m.qualityIndex}</div>
                </div>
              </div>
              <ProgressBar value={m.qualityIndex} tone={m.qualityIndex >= 75 ? "success" : m.qualityIndex >= 60 ? "warning" : "danger"} />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1 num">
                <span>{formatShort(m.fact)} ₽ · {Math.round(m.fact/m.plan*100)}%</span>
                <span>маржа {m.marginPct}% · просрочка {formatShort(m.overdue)} ₽</span>
              </div>
            </Link>
          ))}
          <Link to="/managers" className="mt-1 inline-flex items-center gap-1 text-[12px] text-accent">Все менеджеры <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function MoneyRow({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const dot = { default: "bg-border", success: "bg-success", warning: "bg-warning", danger: "bg-destructive" }[tone];
  const valCls = { default: "text-foreground", success: "text-success", warning: "text-warning", danger: "text-destructive" }[tone];
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
        <div className="min-w-0">
          <div className="text-[13px] text-foreground leading-tight">{label}</div>
          {hint && <div className="text-[10.5px] text-muted-foreground leading-tight mt-0.5 truncate">{hint}</div>}
        </div>
      </div>
      <div className={cn("num text-[14px] font-semibold text-right shrink-0", valCls)}>{value}</div>
    </div>
  );
}

function TodayActionsMobile() {
  const items = priorityActions.slice(0, 4);
  return (
    <Card className="!p-0 overflow-hidden border-l-4 border-l-success">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <ListChecks className="h-4 w-4 text-success" />
        <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground/80">Что сделать сегодня</div>
      </div>
      <div className="divide-y divide-border border-t border-border">
        {items.map((a, i) => (
          <div key={i} className="px-4 py-2.5">
            <div className="flex items-start gap-2.5">
              <div className="h-5 w-5 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[11px] font-bold shrink-0">{i + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium leading-snug">{a.title}</div>
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px] mt-1">
                  <span className="text-muted-foreground">Эффект:</span><span className="text-success font-medium">{a.effect}</span>
                  <span className="text-muted-foreground">Владелец:</span><span>{a.owner}</span>
                  <span className="text-muted-foreground">Срок:</span><span>{a.due}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
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
