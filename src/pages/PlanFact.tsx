import { Card, PageHeader, Stat, ProgressBar } from "@/components/ui-bits";
import {
  monthPlan, monthFact, monthForecast, planMargin, factMargin, planPayments,
  factPayments, formatShort, planFactTrend
} from "@/data/demo";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend
} from "recharts";

export default function PlanFact() {
  const blocks = [
    { label: "Выручка", plan: monthPlan, fact: monthFact, forecast: monthForecast },
    { label: "Оплаты", plan: planPayments, fact: factPayments, forecast: 19_100_000 },
    { label: "Маржа", plan: planMargin, fact: factMargin, forecast: 6_400_000 },
  ];

  return (
    <>
      <PageHeader back={{ to: "/", label: "Дашборд" }} title="План-факт" subtitle="Не только по выручке — но и по оплатам и марже" />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {blocks.map((b) => {
          const pct = Math.round(b.fact / b.plan * 100);
          const fpct = Math.round(b.forecast / b.plan * 100);
          const dev = b.fact - b.plan;
          return (
            <Card key={b.label} title={`План-факт: ${b.label}`}>
              <div className="space-y-3">
                <Stat label="План" value={formatShort(b.plan) + " ₽"} />
                <Stat label="Факт" value={formatShort(b.fact) + " ₽"} tone={pct >= 95 ? "success" : "warning"} hint={`${pct}% плана`} />
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Выполнение</span><span className="num font-semibold text-foreground">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} tone={pct >= 95 ? "success" : pct >= 80 ? "warning" : "danger"} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm pt-1">
                  <Row label="Отклонение ₽" value={formatShort(dev) + " ₽"} tone={dev >= 0 ? "success" : "danger"} />
                  <Row label="Отклонение %" value={(pct - 100) + "%"} tone={pct >= 100 ? "success" : "danger"} />
                  <Row label="Прогноз" value={formatShort(b.forecast) + " ₽"} />
                  <Row label="% плана" value={fpct + "%"} tone={fpct >= 95 ? "success" : "warning"} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card title="Динамика по неделям" subtitle="План · Факт · Оплаты">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={planFactTrend.map(d => ({ ...d, plan: d.plan/1_000_000, fact: d.fact/1_000_000, paid: d.paid/1_000_000 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit=" млн" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} formatter={(v: number) => `${v.toFixed(2)} млн ₽`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="plan" name="План" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={2} />
              <Line type="monotone" dataKey="fact" name="Факт" stroke="hsl(var(--accent))" strokeWidth={2.5} />
              <Line type="monotone" dataKey="paid" name="Оплаты" stroke="hsl(var(--success))" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-4 border-l-4 border-l-destructive" title="Риск невыполнения плана">
        <div className="text-sm space-y-1 text-foreground/85">
          <div>• Прогноз до конца месяца — <span className="font-semibold num">{formatShort(monthForecast)} ₽</span>, отставание <span className="font-semibold num text-destructive">{formatShort(monthPlan - monthForecast)} ₽</span></div>
          <div>• План по оплатам выполнен на <span className="font-semibold">78%</span> — критическое отставание</div>
          <div>• Маржа ниже плановой на <span className="font-semibold">3,2 п.п.</span> — сделки идут со скидкой</div>
        </div>
      </Card>
    </>
  );
}

function Row({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" | "warning" }) {
  const cls = { default: "", success: "text-success", danger: "text-destructive", warning: "text-warning" }[tone];
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`num font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
