import { Link, useParams } from "react-router-dom";
import { managers, deals, clients, formatRub, formatShort, riskColor, paymentStatusColor, managerHoldingCost, FINANCING_RATE } from "@/data/demo";
import { Card, PageHeader, Stat, Badge, ProgressBar } from "@/components/ui-bits";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export default function ManagerProfile() {
  const { id } = useParams();
  const m = managers.find((x) => x.id === id) ?? managers[0];
  const myDeals = deals.filter((d) => d.manager === m.name);
  const lowMargin = myDeals.filter((d) => d.marginPct < 15 && d.stage === "Выиграна");
  const overdueClients = clients.filter((c) => c.manager === m.name && c.overdue > 0);
  const planPct = Math.round(m.fact / m.plan * 100);
  const paidPct = Math.round(m.paid / m.fact * 100);
  const overduePct = Math.round(m.overdue / m.fact * 100);

  const isRisk = m.risk !== "норма";
  const mHC = managerHoldingCost(m.name);

  return (
    <>
      <PageHeader
        back={{ to: "/managers", label: "Менеджеры" }}
        extraBack={{ to: "/", label: "Дашборд" }}
        title={m.name}
        subtitle={`${m.title} · Индекс качества ${m.qualityIndex}/100`}
        actions={<Badge className={riskColor[m.risk]}>{m.risk}</Badge>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mb-6">
        <Stat label="Факт / план выручки" value={`${planPct}%`} hint={`${formatShort(m.fact)} / ${formatShort(m.plan)} ₽`} tone={planPct >= 100 ? "success" : "warning"} />
        <Stat label="Оплачено / факт" value={`${paidPct}%`} hint={`${formatShort(m.paid)} ₽`} tone={paidPct >= 80 ? "success" : "warning"} />
        <Stat label="Маржа" value={m.marginPct + "%"} hint={`${formatShort(m.margin)} ₽`} tone={m.marginPct >= 20 ? "success" : "warning"} />
        <Stat label="Дебиторка" value={formatShort(m.receivable) + " ₽"} />
        <Stat label="Просрочка" value={formatShort(m.overdue) + " ₽"} tone="danger" hint={`${overduePct}% выручки`} />
        <Stat label="Стоимость просрочки" value={(mHC > 0 ? formatShort(mHC) : "0") + " ₽"} tone={mHC > 30_000 ? "danger" : mHC > 0 ? "warning" : "success"} hint={`ставка ${Math.round(FINANCING_RATE*100)}%`} />
        <Stat label="Индекс качества" value={`${m.qualityIndex}/100`} tone={m.qualityIndex >= 75 ? "success" : m.qualityIndex >= 60 ? "warning" : "danger"} />
      </div>

      {/* Управленческий вывод */}
      <Card className={`mb-6 border-l-4 ${isRisk ? "border-l-destructive" : "border-l-success"}`} title="Управленческий вывод">
        <p className="text-sm text-foreground/90 leading-relaxed">
          {isRisk ? (
            <>Менеджер {planPct >= 100 ? "выполняет план по выручке" : `отстаёт от плана (${planPct}%)`}, но <span className="font-semibold text-destructive">качество продаж в зоне {m.risk}</span>: {100 - paidPct}% выручки не оплачено, средняя маржа {m.marginPct}% {m.marginPct < 20 ? "ниже целевой 20%" : "в пределах нормы"}, просроченная дебиторка {formatShort(m.overdue)} ₽ ({overduePct}% выручки), стоимость просрочки по ставке {Math.round(FINANCING_RATE*100)}% составляет <span className="num font-semibold text-destructive">{formatShort(mHC)} ₽</span>. Средний срок оплаты {m.avgPaymentDays} дн при норме 21 дн. <span className="font-medium">Рекомендуется ограничить отсрочку по новым сделкам и разобрать условия с {overdueClients.length || 3} крупнейшими клиентами.</span></>
          ) : (
            <>Менеджер показывает <span className="font-semibold text-success">высокое качество продаж</span>: план по выручке выполнен на {planPct}%, оплачено {paidPct}% факта, маржа {m.marginPct}%, просрочка {overduePct}% выручки. Портфель клиентов устойчивый, риск кассового разрыва минимальный.</>
          )}
        </p>
      </Card>

      {/* План-факт: выручка vs оплаты */}
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <Card title="План-факт по выручке" subtitle="что продано">
          <Stat label="План" value={formatShort(m.plan) + " ₽"} />
          <div className="mt-2"><Stat label="Факт" value={formatShort(m.fact) + " ₽"} tone={planPct >= 100 ? "success" : "warning"} hint={<ProgressBar value={Math.min(planPct, 100)} tone={planPct >= 100 ? "success" : "warning"} />} /></div>
        </Card>
        <Card title="План-факт по оплатам" subtitle="что реально получено деньгами">
          <Stat label="План оплат" value={formatShort(m.plan * 0.8) + " ₽"} hint="≈80% выручки" />
          <div className="mt-2"><Stat label="Факт оплат" value={formatShort(m.paid) + " ₽"} tone={m.paid >= m.plan * 0.8 ? "success" : "danger"} hint={<ProgressBar value={Math.round(m.paid / (m.plan * 0.8) * 100)} tone={m.paid >= m.plan * 0.8 ? "success" : "danger"} />} /></div>
        </Card>
      </div>

      {/* Сценарий риска */}
      {isRisk && (
        <Card className="mb-6 border-l-4 border-l-destructive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold text-base mb-2">
                Продал много, но деньги зависли — качество продаж в зоне риска
              </h3>
              <div className="grid lg:grid-cols-2 gap-5">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Причины</div>
                  <ul className="text-sm space-y-1.5 text-foreground/85">
                    <li>• {paidPct}% выручки оплачено, {100 - paidPct}% зависло</li>
                    <li>• Просроченная дебиторка растёт: {formatShort(m.overdue)} ₽</li>
                    <li>• {m.lowMarginDeals} крупных сделок с маржой ниже минимальной</li>
                    <li>• Средний срок оплаты {m.avgPaymentDays} дн (норма 21 дн)</li>
                    <li>• Есть риск кассового разрыва по клиентам менеджера</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Рекомендации руководителю</div>
                  <ul className="text-sm space-y-1.5 text-foreground/85">
                    <li>• Проверить условия оплаты по новым сделкам</li>
                    <li>• Ограничить продажи с отсрочкой клиентам с просрочкой</li>
                    <li>• Пересмотреть минимальную маржу</li>
                    <li>• Ввести KPI по оплаченной выручке, не только по продажам</li>
                    <li>• Разобрать просроченную дебиторку по клиентам</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="План-факт по выручке" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={[
                { p: "План", v: m.plan / 1_000_000 },
                { p: "Факт", v: m.fact / 1_000_000 },
                { p: "Оплачено", v: m.paid / 1_000_000 },
                { p: "Маржа", v: m.margin / 1_000_000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="p" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit=" млн" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} formatter={(v: number) => `${v.toFixed(2)} млн ₽`} />
                <Bar dataKey="v" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Качество продаж менеджера">
          <dl className="text-sm space-y-2">
            <Row label="Продано" value={`${formatShort(m.fact)} ₽`} />
            <Row label="Оплачено" value={`${formatShort(m.paid)} ₽`} tone="success" />
            <Row label="Не оплачено" value={`${formatShort(m.fact - m.paid)} ₽`} tone="warning" />
            <Row label="Валовая маржа" value={`${formatShort(m.margin)} ₽`} />
            <Row label="Маржинальность" value={`${m.marginPct}%`} />
            <Row label="Сумма просрочки" value={`${formatShort(m.overdue)} ₽`} tone="danger" />
            <Row label="Доля просрочки" value={`${overduePct}%`} tone={overduePct > 20 ? "danger" : "default"} />
            <Row label="Средний срок оплаты" value={`${m.avgPaymentDays} дн`} />
            <Row label="Проблемные клиенты" value={String(overdueClients.length)} />
            <Row label="Общий статус" value={<Badge className={riskColor[m.risk]}>{m.risk}</Badge>} />
          </dl>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title="Низкомаржинальные сделки" subtitle="маржа ниже 15%">
          {lowMargin.length === 0 ? (
            <Empty text="Нет сделок ниже минимальной маржи" />
          ) : (
            <div className="space-y-2">
              {lowMargin.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium">{d.client}</div>
                    <div className="text-[11px] text-muted-foreground">{d.discountReason ?? "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="num">{formatShort(d.amount)} ₽</div>
                    <div className="text-[11px] text-destructive">маржа {d.marginPct}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Клиенты с просрочкой">
          {overdueClients.length === 0 ? (
            <Empty text="Нет клиентов с просрочкой" />
          ) : (
            <div className="space-y-2">
              {overdueClients.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">макс. просрочка {c.maxOverdueDays} дн</div>
                  </div>
                  <div className="text-right">
                    <div className="num text-destructive font-medium">{formatShort(c.overdue)} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Сделки менеджера в работе">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                <th className="font-medium pb-2">Клиент</th>
                <th className="font-medium pb-2 text-right">Сумма</th>
                <th className="font-medium pb-2 text-right">Маржа</th>
                <th className="font-medium pb-2 text-right">Этап</th>
                <th className="font-medium pb-2 text-right">Оплата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myDeals.slice(0, 10).map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="py-2.5">{d.client}</td>
                  <td className="py-2.5 text-right num">{formatShort(d.amount)} ₽</td>
                  <td className={`py-2.5 text-right num ${d.marginPct < 15 ? "text-destructive" : ""}`}>{d.marginPct}%</td>
                  <td className="py-2.5 text-right text-muted-foreground">{d.stage}</td>
                  <td className="py-2.5 text-right"><Badge className={paymentStatusColor[d.paymentStatus]}>{d.paymentStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Row({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "success" | "warning" | "danger" }) {
  const cls = { default: "", success: "text-success", warning: "text-warning", danger: "text-destructive" }[tone];
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-1.5 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-semibold num ${cls}`}>{value}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-sm text-muted-foreground flex items-center gap-2 py-2">
      <CheckCircle2 className="h-4 w-4 text-success" /> {text}
    </div>
  );
}
