import { Link } from "react-router-dom";
import {
  managers, redFlags, monthPlan, monthFact, monthForecast, planMargin, factMargin,
  planPayments, factPayments, totalReceivable, overdueReceivable, avgPaymentDays,
  forecastIncoming, deals, formatRub, formatShort, riskColor, cashGap, avgQualityIndex,
  totalHoldingCost, avgOverdueDays, FINANCING_RATE
} from "@/data/demo";
import { Card, PageHeader, Stat, Badge, ProgressBar } from "@/components/ui-bits";
import { AlertTriangle, TrendingUp, Wallet, Target, Activity, ShieldAlert, ArrowRight, ArrowRightCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell
} from "recharts";

const lowMarginCount = deals.filter(d => d.marginPct < 15 && d.stage === "Выиграна").length;
const planPct = Math.round(monthFact / monthPlan * 100);

const severityCls = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-warning bg-warning/5",
};

const sortedByQuality = [...managers].sort((a, b) => b.qualityIndex - a.qualityIndex);

export default function Dashboard() {
  const paidPct = Math.round(factPayments / monthFact * 100);
  const unpaidPct = 100 - paidPct;

  return (
    <>
      <PageHeader
        title="Управленческий дашборд"
        subtitle="Качество продаж = выручка × маржа × оплаты. Май 2026"
      />

      {/* Управленческий вывод — главное за 30 секунд */}
      <Card className="mb-4 border-l-4 border-l-warning">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Управленческий вывод</div>
            <p className="text-sm lg:text-[15px] text-foreground/90 leading-relaxed">
              Выручка выглядит сильной — <span className="font-semibold">{planPct}% плана</span>, но <span className="font-semibold text-warning">качество продаж в зоне контроля</span>: <span className="font-semibold">{unpaidPct}%</span> продаж не оплачено, просроченная дебиторка <span className="num font-semibold text-destructive">{formatShort(overdueReceivable)} ₽</span> ({Math.round(overdueReceivable/totalReceivable*100)}% дебиторки), а прогноз поступлений ниже обязательных платежей на <span className="num font-semibold text-destructive">{formatShort(cashGap)} ₽</span> — есть риск кассового разрыва к концу месяца.
            </p>
          </div>
        </div>
      </Card>

      {/* Storyline — главная связка продукта */}
      <Card className="mb-6 bg-gradient-to-r from-header to-header/95 border-header text-white">
        <div className="text-[11px] uppercase tracking-wider text-white/60 mb-3">Связка качества продаж</div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 items-stretch">
          <StoryStep label="Продано" value={formatShort(monthFact) + " ₽"} status="контроль" meaning={`${planPct}% плана — почти выполнено`} />
          <StoryStep label="Маржа" value="22,4%" status="контроль" meaning="ниже цели 25%" />
          <StoryStep label="Оплачено" value={formatShort(factPayments) + " ₽"} status="контроль" meaning={`${paidPct}% выручки — недостаточно`} />
          <StoryStep label="Дебиторка" value={formatShort(totalReceivable) + " ₽"} status="контроль" meaning={`срок ${avgPaymentDays} дн (норма 21)`} />
          <StoryStep label="Просрочка" value={formatShort(overdueReceivable) + " ₽"} status="критично" meaning={`${avgOverdueDays} дн · стоимость ≈ ${formatShort(totalHoldingCost)} ₽`} />
          <StoryStep label="Кассовый разрыв" value={"−" + formatShort(cashGap) + " ₽"} status="критично" meaning="к концу месяца" />
        </div>
      </Card>

      {/* 4 блока */}
      <div className="space-y-6">
        {/* 1. Результат продаж */}
        <section>
          <SectionTitle icon={<Target className="h-4 w-4" />} title="Результат продаж" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            <Stat label="План продаж" value={formatShort(monthPlan) + " ₽"} hint="на месяц" />
            <Stat label="Факт продаж" value={formatShort(monthFact) + " ₽"} hint={`${planPct}% плана`} tone={planPct >= 95 ? "success" : "warning"} />
            <Stat label="Выполнение плана" value={planPct + "%"} hint={<ProgressBar value={planPct} tone={planPct >= 95 ? "success" : "warning"} />} />
            <Stat label="Прогноз до конца" value={formatShort(monthForecast) + " ₽"} hint={`${Math.round(monthForecast / monthPlan * 100)}% плана`} />
            <Stat label="Индекс качества продаж" value={avgQualityIndex + "/100"} tone={avgQualityIndex >= 75 ? "success" : avgQualityIndex >= 60 ? "warning" : "danger"} hint="средний по команде" />
          </div>
        </section>

        {/* 2. Качество продаж */}
        <section>
          <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Качество продаж" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            <Stat label="Валовая маржа" value={formatShort(factMargin) + " ₽"} hint={`план ${formatShort(planMargin)} ₽`} />
            <Stat label="Средняя маржинальность" value="22,4%" hint="цель 25%" tone="warning" />
            <Stat label="Низкомаржинальные" value={lowMarginCount} hint="<15% маржи" tone="danger" />
            <Stat label="Сделки со скидкой" value="9" hint="из 22 выигранных" />
            <Stat label="Ниже мин. маржи" value="5" tone="danger" hint="требуют разбора" />
          </div>
        </section>

        {/* 3. Деньги */}
        <section>
          <SectionTitle icon={<Wallet className="h-4 w-4" />} title="Деньги" />
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
            <Stat label="Оплаченная выручка" value={formatShort(factPayments) + " ₽"} tone="success" />
            <Stat label="Неоплаченная" value={formatShort(monthFact - factPayments) + " ₽"} tone="warning" />
            <Stat label="Дебиторка" value={formatShort(totalReceivable) + " ₽"} />
            <Stat label="Просроченная" value={formatShort(overdueReceivable) + " ₽"} tone="danger" hint={`${Math.round(overdueReceivable/totalReceivable*100)}% от дебиторки`} />
            <Stat label="Срок оплаты" value={avgPaymentDays + " дн"} hint="средний" tone="warning" />
            <Stat label="Прогноз поступлений" value={formatShort(forecastIncoming) + " ₽"} hint={`план ${formatShort(planPayments)} ₽`} tone="warning" />
          </div>
        </section>

        {/* 4. Риски */}
        <section>
          <SectionTitle icon={<ShieldAlert className="h-4 w-4" />} title="Риски" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            <Stat label="Красные флаги" value={redFlags.filter(f => f.severity === "high").length} tone="danger" />
            <Stat label="Проблемные клиенты" value="3" tone="danger" hint="статус «риск» / «стоп»" />
            <Stat label="Сделки без движения" value="6" tone="warning" hint=">7 дней" />
            <Stat label="Клиенты с просрочкой" value="5" tone="warning" />
            <Stat label="Менеджеры в риск-зоне" value={managers.filter(m => m.risk !== "норма").length} tone="warning" />
          </div>
        </section>

        {/* Красные флаги — главный блок */}
        <Card
          title={<span className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Красные флаги</span>}
          subtitle="Проблема · Сумма · Кого касается · Рекомендуемое действие"
        >
          <div className="grid md:grid-cols-2 gap-2">
            {redFlags.map((f, i) => (
              <div key={i} className={`border-l-2 ${severityCls[f.severity]} px-4 py-3 rounded-r-md`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm font-semibold leading-snug">{f.title}</div>
                  <Badge className={f.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/30 shrink-0" : "bg-warning/10 text-warning border-warning/30 shrink-0"}>
                    {f.severity === "high" ? "Высокий" : "Средний"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] mb-2">
                  {f.amount && (<><div className="text-muted-foreground">Сумма / показатель</div><div className="num font-medium text-right">{f.amount}</div></>)}
                  {f.who && (<><div className="text-muted-foreground">Кого касается</div><div className="font-medium text-right">{f.who}</div></>)}
                  <div className="text-muted-foreground">Область</div><div className="text-right">{f.area}</div>
                </div>
                <div className="flex items-start gap-1.5 text-[12px] text-foreground/85 border-t border-border/60 pt-2">
                  <ArrowRightCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                  <span><span className="text-muted-foreground">Действие:</span> {f.action}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* План-факт-оплаты chart */}
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

          {/* Индекс качества — top менеджеры */}
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

        {/* Менеджеры — быстрый обзор */}
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

function StoryStep({ label, value, meaning, status = "норма" }: { label: string; value: string; meaning?: string; status?: "норма" | "контроль" | "критично" }) {
  const dot = { "норма": "bg-success", "контроль": "bg-warning", "критично": "bg-destructive" }[status];
  const valueCls = status === "критично" ? "text-white" : status === "контроль" ? "text-white" : "text-white";
  const ring = status === "критично" ? "ring-1 ring-destructive/40 bg-destructive/10" : "bg-white/[0.04]";
  return (
    <div className={`relative px-3 py-2.5 rounded-md border border-white/10 ${ring}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[10px] uppercase tracking-wider text-white/55">{label}</div>
        <div className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-[9px] uppercase tracking-wide text-white/65">{status}</span>
        </div>
      </div>
      <div className={`font-display font-semibold text-base lg:text-lg num leading-tight ${valueCls}`}>{value}</div>
      {meaning && <div className="text-[10px] text-white/55 mt-0.5 leading-snug">{meaning}</div>}
    </div>
  );
}
