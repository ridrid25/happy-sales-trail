import { funnelStages, formatShort } from "@/data/demo";
import { Card, PageHeader } from "@/components/ui-bits";

export default function Funnel() {
  const totalSales = funnelStages.find(s => s.stage === "Выиграна")!.amount;
  const lost = funnelStages.find(s => s.stage === "Потеряна")!.amount;
  const inWork = funnelStages.filter(s => !["Выиграна", "Потеряна"].includes(s.stage));
  const maxAmount = Math.max(...funnelStages.map(s => s.amount));

  return (
    <>
      <PageHeader
        back={{ to: "/", label: "Дашборд" }}
        title="Воронка продаж"
        subtitle="Количество и качество будущих денег: сумма, ожидаемая маржа, ожидаемые оплаты"
      />

      <Card title="Этапы воронки">
        <div className="space-y-3">
          {funnelStages.map((s) => {
            const width = (s.amount / maxAmount) * 100;
            const isWon = s.stage === "Выиграна";
            const isLost = s.stage === "Потеряна";
            return (
              <div key={s.stage} className="grid grid-cols-12 gap-3 items-center text-sm">
                <div className="col-span-12 lg:col-span-3 font-medium flex items-center justify-between lg:block">
                  <span>{s.stage}</span>
                  <span className="text-[11px] text-muted-foreground lg:hidden">{s.count} сделок</span>
                </div>
                <div className="col-span-12 lg:col-span-5">
                  <div className="h-7 bg-muted rounded-md overflow-hidden relative">
                    <div
                      className={`h-full ${isLost ? "bg-destructive/60" : isWon ? "bg-success" : "bg-accent"} flex items-center px-3 text-white text-[12px] font-semibold num`}
                      style={{ width: `${Math.max(width, 8)}%` }}
                    >
                      {formatShort(s.amount)} ₽
                    </div>
                  </div>
                </div>
                <div className="col-span-4 lg:col-span-1 text-right num hidden lg:block">{s.count}</div>
                <div className="col-span-4 lg:col-span-1 text-right num text-muted-foreground">{s.conversion}%</div>
                <div className="col-span-4 lg:col-span-1 text-right num text-muted-foreground">{s.avgDays} дн</div>
                <div className="col-span-4 lg:col-span-1 text-right num text-destructive">{s.overdueActions || ""}</div>
              </div>
            );
          })}
          <div className="grid grid-cols-12 gap-3 text-[10px] uppercase tracking-wide text-muted-foreground border-t border-border pt-2 mt-2 hidden lg:grid">
            <div className="col-span-3">Этап</div>
            <div className="col-span-5">Сумма сделок</div>
            <div className="col-span-1 text-right">Сделок</div>
            <div className="col-span-1 text-right">Конверсия</div>
            <div className="col-span-1 text-right">Ср. время</div>
            <div className="col-span-1 text-right">Просроч.</div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card title="Качество будущих денег" subtitle="Ожидаемая маржа и оплаты по этапам в работе">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase text-muted-foreground border-b border-border">
                <th className="text-left font-medium pb-2">Этап</th>
                <th className="text-right font-medium pb-2">Потенц. выручка</th>
                <th className="text-right font-medium pb-2">Ожид. маржа</th>
                <th className="text-right font-medium pb-2">Ожид. оплаты</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inWork.map((s) => (
                <tr key={s.stage}>
                  <td className="py-2">{s.stage}</td>
                  <td className="py-2 text-right num">{formatShort(s.amount)} ₽</td>
                  <td className="py-2 text-right num text-success">{formatShort(s.expectedMargin)} ₽</td>
                  <td className="py-2 text-right num text-accent">{s.expectedPayments > 0 ? `${formatShort(s.expectedPayments)} ₽` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Итоги воронки">
          <dl className="text-sm space-y-2">
            <Row label="Выиграно" value={`${formatShort(totalSales)} ₽`} tone="success" />
            <Row label="Потеряно" value={`${formatShort(lost)} ₽`} tone="danger" />
            <Row label="Сделки в работе" value={String(inWork.reduce((s, x) => s + x.count, 0))} />
            <Row label="Сумма в работе" value={`${formatShort(inWork.reduce((s, x) => s + x.amount, 0))} ₽`} />
            <Row label="Ожидаемая маржа" value={`${formatShort(inWork.reduce((s, x) => s + x.expectedMargin, 0))} ₽`} tone="success" />
            <Row label="Ожидаемые оплаты до конца мес." value={`${formatShort(inWork.reduce((s, x) => s + x.expectedPayments, 0))} ₽`} tone="accent" />
            <Row label="Просроченные действия" value={String(funnelStages.reduce((s, x) => s + x.overdueActions, 0))} tone="danger" />
          </dl>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "success" | "danger" | "accent" }) {
  const cls = { default: "", success: "text-success", danger: "text-destructive", accent: "text-accent" }[tone];
  return (
    <div className="flex items-center justify-between border-b border-border last:border-0 pb-1.5 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-semibold num ${cls}`}>{value}</dd>
    </div>
  );
}
