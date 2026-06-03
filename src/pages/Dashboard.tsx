import { Link } from "react-router-dom";
import {
  managers, redFlags, monthPlan, monthFact, monthForecast, planMargin, factMargin,
  planPayments, factPayments, totalReceivable, overdueReceivable, avgPaymentDays,
  forecastIncoming, deals, formatRub, formatShort, riskColor, cashGap, avgQualityIndex
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
  return (
    <>
      <PageHeader
        title="Управленческий дашборд"
        subtitle="Качество продаж = выручка × маржа × оплаты. Май 2026"
      />

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
            <Stat label="Отклонение" value={formatShort(monthFact - monthPlan) + " ₽"} tone="danger" hint="к плану месяца" />
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
          subtitle="Требуют управленческого решения"
        >
          <div className="space-y-2">
            {redFlags.map((f, i) => (
              <div key={i} className={`border-l-2 ${severityCls[f.severity]} px-4 py-3 rounded-r-md flex items-start justify-between gap-3`}>
                <div>
                  <div className="text-sm font-medium leading-snug">{f.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{f.area}</div>
                </div>
                <Badge className={f.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-warning/10 text-warning border-warning/30"}>
                  {f.severity === "high" ? "Высокий" : "Средний"}
                </Badge>
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
          subtitle="Не путать с лидербордом: оценка по марже и оплатам"
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
