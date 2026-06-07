import { clients, formatShort, clientStatusColor } from "@/data/demo";
import { Card, PageHeader, Badge } from "@/components/ui-bits";
import { AlertTriangle } from "lucide-react";

export default function Clients() {
  return (
    <>
      <PageHeader back={{ to: "/", label: "Дашборд" }} title="Клиенты" subtitle="Финансовое качество клиентской базы" />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clients.map((c) => {
          const risky = c.status === "риск" || c.status === "стоп";
          const paidPct = Math.round(c.paid / c.totalSales * 100);
          return (
            <div key={c.id} className="bg-card border border-border rounded-lg p-4 shadow-card">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-display font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">Менеджер: {c.manager}</div>
                </div>
                <Badge className={clientStatusColor[c.status]}>{c.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <Row label="Объём продаж" value={`${formatShort(c.totalSales)} ₽`} />
                <Row label="Оплачено" value={`${paidPct}%`} tone="success" />
                <Row label="Дебиторка" value={`${formatShort(c.receivable)} ₽`} />
                <Row label="Просрочка" value={`${formatShort(c.overdue)} ₽`} tone={c.overdue > 0 ? "danger" : "default"} />
                <Row label="Маржа ср." value={`${c.avgMarginPct}%`} tone={c.avgMarginPct < 15 ? "danger" : "default"} />
                <Row label="Срок оплаты" value={`${c.avgPaymentDays} дн`} />
                <Row label="Макс. просрочка" value={c.maxOverdueDays > 0 ? `${c.maxOverdueDays} дн` : "—"} tone={c.maxOverdueDays > 0 ? "danger" : "default"} />
                <Row label="Проблем. сделок" value={String(c.problemDeals)} />
              </div>

              {risky && (
                <div className="mt-3 border-l-2 border-l-destructive bg-destructive/5 text-[12px] p-2 rounded-r-md flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    У клиента есть просрочка <span className="font-semibold num">{formatShort(c.overdue)} ₽</span> на {c.maxOverdueDays} дн.
                    Новая сделка с отсрочкой требует согласования.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Row({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" }) {
  const cls = { default: "", success: "text-success", danger: "text-destructive" }[tone];
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className={`num font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
