import { managers, clients, deals, formatShort, totalReceivable, overdueReceivable, avgPaymentDays, forecastIncoming, riskColor, clientStatusColor } from "@/data/demo";
import { Card, PageHeader, Stat, Badge } from "@/components/ui-bits";

export default function Receivables() {
  const clientsOverdue = clients.filter(c => c.overdue > 0);
  const managersCritical = managers.filter(m => m.overdue > 500_000);
  const overdueDeals = deals.filter(d => d.overdueDays > 0);

  return (
    <>
      <PageHeader title="Дебиторская задолженность" subtitle="Качество денег от продаж: оплаты, дебиторка, просрочка" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Общая дебиторка" value={formatShort(totalReceivable) + " ₽"} />
        <Stat label="Просроченная" value={formatShort(overdueReceivable) + " ₽"} tone="danger" hint={`${Math.round(overdueReceivable/totalReceivable*100)}% от дебиторки`} />
        <Stat label="Средний срок оплаты" value={avgPaymentDays + " дн"} tone="warning" />
        <Stat label="Прогноз поступлений" value={formatShort(forecastIncoming) + " ₽"} tone="warning" />
        <Stat label="Клиентов с просрочкой" value={clientsOverdue.length} />
        <Stat label="Менеджеры в риске" value={managersCritical.length} tone="danger" hint=">500 тыс просрочка" />
        <Stat label="Доля просрочки" value={Math.round(overdueReceivable/totalReceivable*100) + "%"} tone="danger" />
        <Stat label="Сделок в просрочке" value={overdueDeals.length} tone="warning" />
      </div>

      <Card title="Дебиторка по менеджерам" className="mb-4">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                <Th>Менеджер</Th><Th right>Выручка</Th><Th right>Оплачено</Th>
                <Th right>Дебиторка</Th><Th right>Просрочка</Th><Th right>Доля просрочки</Th>
                <Th right>Срок оплаты</Th><Th right>Клиентов с проср.</Th><Th right>Статус</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {managers.map((m) => {
                const overdueShare = Math.round(m.overdue / Math.max(m.fact, 1) * 100);
                const clientsCount = clients.filter(c => c.manager === m.name && c.overdue > 0).length;
                return (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-2 font-medium">{m.name}</td>
                    <Td>{formatShort(m.fact)}</Td>
                    <Td className="text-success">{formatShort(m.paid)}</Td>
                    <Td>{formatShort(m.receivable)}</Td>
                    <Td className={m.overdue > 500_000 ? "text-destructive font-semibold" : m.overdue > 0 ? "text-warning" : ""}>{formatShort(m.overdue)}</Td>
                    <Td className={overdueShare > 20 ? "text-destructive" : ""}>{overdueShare}%</Td>
                    <Td>{m.avgPaymentDays} дн</Td>
                    <Td>{clientsCount}</Td>
                    <td className="py-2.5 px-2 text-right"><Badge className={riskColor[m.risk]}>{m.risk}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Дебиторка по клиентам">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                <Th>Клиент</Th><Th>Менеджер</Th><Th right>Долг</Th><Th right>Просрочка</Th>
                <Th right>Дней просрочки</Th><Th right>План оплаты</Th><Th right>Статус</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientsOverdue.map((c) => {
                const deal = deals.find(d => d.client === c.name && d.overdueDays > 0);
                return (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-2 font-medium">{c.name}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.manager}</td>
                    <Td>{formatShort(c.receivable)}</Td>
                    <Td className="text-destructive font-semibold">{formatShort(c.overdue)}</Td>
                    <Td className="text-destructive">{c.maxOverdueDays} дн</Td>
                    <Td>{deal?.planPayDate ?? "—"}</Td>
                    <td className="py-2.5 px-2 text-right"><Badge className={clientStatusColor[c.status]}>{c.status}</Badge></td>
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
  return <th className={`font-medium pb-2 px-2 whitespace-nowrap ${right ? "text-right" : ""}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2.5 px-2 text-right num ${className}`}>{children}</td>;
}
