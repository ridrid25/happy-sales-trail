import { Link } from "react-router-dom";
import { managers, formatRub, formatShort, riskColor } from "@/data/demo";
import { Card, PageHeader, Badge, ProgressBar } from "@/components/ui-bits";
import { useState } from "react";

type Sort = "quality" | "fact" | "margin" | "overdue";

export default function Managers() {
  const [sort, setSort] = useState<Sort>("quality");
  const sorted = [...managers].sort((a, b) => {
    if (sort === "fact") return b.fact - a.fact;
    if (sort === "margin") return b.marginPct - a.marginPct;
    if (sort === "overdue") return b.overdue - a.overdue;
    return b.qualityIndex - a.qualityIndex;
  });

  return (
    <>
      <PageHeader
        title="Менеджеры"
        subtitle="Оценка по качеству продаж: маржа, оплаты, дебиторка — не только выручка"
        actions={
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="text-sm bg-card border border-border rounded-md px-3 py-1.5">
            <option value="quality">По качеству продаж</option>
            <option value="fact">По выручке</option>
            <option value="margin">По марже</option>
            <option value="overdue">По просрочке</option>
          </select>
        }
      />

      {/* Cards mobile, table desktop */}
      <div className="grid gap-3 lg:hidden">
        {sorted.map((m) => {
          const planPct = Math.round(m.fact / m.plan * 100);
          return (
            <Link key={m.id} to={`/managers/${m.id}`} className="bg-card rounded-lg border border-border p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.title}</div>
                </div>
                <Badge className={riskColor[m.risk]}>{m.risk}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Факт / план" value={`${formatShort(m.fact)} / ${formatShort(m.plan)}`} />
                <Metric label="% плана" value={`${planPct}%`} />
                <Metric label="Маржа" value={`${m.marginPct}%`} />
                <Metric label="Оплачено" value={`${formatShort(m.paid)} ₽`} />
                <Metric label="Дебиторка" value={`${formatShort(m.receivable)} ₽`} />
                <Metric label="Просрочка" value={`${formatShort(m.overdue)} ₽`} danger={m.overdue > 0} />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Индекс качества</span><span className="num font-semibold text-foreground">{m.qualityIndex}/100</span>
                </div>
                <ProgressBar value={m.qualityIndex} tone={m.qualityIndex >= 75 ? "success" : m.qualityIndex >= 60 ? "warning" : "danger"} />
              </div>
            </Link>
          );
        })}
      </div>

      <Card className="hidden lg:block">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <Th>Менеджер</Th>
                <Th right>План</Th>
                <Th right>Факт</Th>
                <Th right>% плана</Th>
                <Th right>Маржа ₽</Th>
                <Th right>Маржа %</Th>
                <Th right>Оплачено</Th>
                <Th right>Дебиторка</Th>
                <Th right>Просрочка</Th>
                <Th right>Срок оплаты</Th>
                <Th right>Сделки</Th>
                <Th right>Низкая маржа</Th>
                <Th right>Индекс качества</Th>
                <Th right>Статус</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((m) => {
                const planPct = Math.round(m.fact / m.plan * 100);
                return (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="py-3 pr-4">
                      <Link to={`/managers/${m.id}`} className="font-medium hover:text-accent">{m.name}</Link>
                      <div className="text-[11px] text-muted-foreground">{m.title}</div>
                    </td>
                    <Td>{formatShort(m.plan)}</Td>
                    <Td>{formatShort(m.fact)}</Td>
                    <Td className={planPct >= 100 ? "text-success" : planPct >= 90 ? "" : "text-warning"}>{planPct}%</Td>
                    <Td>{formatShort(m.margin)}</Td>
                    <Td>{m.marginPct}%</Td>
                    <Td>{formatShort(m.paid)}</Td>
                    <Td>{formatShort(m.receivable)}</Td>
                    <Td className={m.overdue > 500_000 ? "text-destructive font-medium" : m.overdue > 0 ? "text-warning" : ""}>{formatShort(m.overdue)}</Td>
                    <Td>{m.avgPaymentDays} дн</Td>
                    <Td>{m.deals}</Td>
                    <Td className={m.lowMarginDeals > 2 ? "text-destructive" : ""}>{m.lowMarginDeals}</Td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="num font-semibold">{m.qualityIndex}</span>
                        <div className="w-16"><ProgressBar value={m.qualityIndex} tone={m.qualityIndex >= 75 ? "success" : m.qualityIndex >= 60 ? "warning" : "danger"} /></div>
                      </div>
                    </td>
                    <td className="py-3 pl-2 text-right"><Badge className={riskColor[m.risk]}>{m.risk}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`font-medium pb-2 px-2 ${right ? "text-right" : ""}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 px-2 text-right num ${className}`}>{children}</td>;
}
function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`num font-semibold ${danger ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
