import { managers, clients, deals, formatShort, totalReceivable, overdueReceivable, avgPaymentDays, forecastIncoming, riskColor, clientStatusColor, planPayments, factPayments, cashGap, plannedOutflow } from "@/data/demo";
import { Card, PageHeader, Stat, Badge } from "@/components/ui-bits";
import { AlertTriangle } from "lucide-react";

export default function Receivables() {
  const clientsOverdue = clients.filter(c => c.overdue > 0);
  const managersCritical = managers.filter(m => m.overdue > 500_000);
  const overdueDeals = deals.filter(d => d.overdueDays > 0);

  // клиенты с просрочкой, у которых есть новая сделка в работе с отсрочкой
  const riskyWithNewDeal = clients.filter(c => c.overdue > 0).map(c => {
    const newDeal = deals.find(d => d.client === c.name && d.stage !== "Выиграна" && d.stage !== "Потеряна" && d.paymentTerms.toLowerCase().includes("отсрочка"));
    return newDeal ? { client: c, deal: newDeal } : null;
  }).filter(Boolean) as { client: typeof clients[number]; deal: typeof deals[number] }[];

  return (
    <>
      <PageHeader title="Дебиторская задолженность" subtitle="Качество денег от продаж: оплаты, дебиторка, просрочка, риск кассового разрыва" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Общая дебиторка" value={formatShort(totalReceivable) + " ₽"} />
        <Stat label="Просроченная" value={formatShort(overdueReceivable) + " ₽"} tone="danger" hint={`${Math.round(overdueReceivable/totalReceivable*100)}% от дебиторки`} />
        <Stat label="Средний срок оплаты" value={avgPaymentDays + " дн"} tone="warning" hint="норма 21 дн" />
        <Stat label="Прогноз поступлений" value={formatShort(forecastIncoming) + " ₽"} tone="warning" hint={`план ${formatShort(planPayments)} ₽`} />
        <Stat label="Клиентов с просрочкой" value={clientsOverdue.length} />
        <Stat label="Менеджеры в риске" value={managersCritical.length} tone="danger" hint=">500 тыс просрочка" />
        <Stat label="Доля просрочки" value={Math.round(overdueReceivable/totalReceivable*100) + "%"} tone="danger" />
        <Stat label="Риск кассового разрыва" value={formatShort(cashGap) + " ₽"} tone="danger" hint={`обязательства ${formatShort(plannedOutflow)} ₽`} />
      </div>

      {/* Прогноз денежного потока */}
      <Card title="Прогноз денежного потока месяца" subtitle="Поступления vs обязательства" className="mb-4 border-l-4 border-l-destructive">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-[11px] uppercase text-muted-foreground mb-1">Поступит</div>
            <div className="num font-display font-semibold text-xl text-success">{formatShort(forecastIncoming)} ₽</div>
            <div className="text-[11px] text-muted-foreground mt-1">Из них {formatShort(overdueReceivable)} ₽ — под риском (просрочка)</div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-muted-foreground mb-1">Нужно заплатить</div>
            <div className="num font-display font-semibold text-xl">{formatShort(plannedOutflow)} ₽</div>
            <div className="text-[11px] text-muted-foreground mt-1">ФОТ, налоги, поставщики</div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-muted-foreground mb-1">Разрыв</div>
            <div className="num font-display font-semibold text-xl text-destructive">−{formatShort(cashGap)} ₽</div>
            <div className="text-[11px] text-destructive mt-1">Требуется ускорить сбор дебиторки</div>
          </div>
        </div>
      </Card>

      {/* Предупреждения по новым сделкам у клиентов с просрочкой */}
      {riskyWithNewDeal.length > 0 && (
        <Card title="Новые сделки с отсрочкой у клиентов с просрочкой" subtitle="Требуют согласования" className="mb-4">
          <div className="space-y-2">
            {riskyWithNewDeal.map(({ client, deal }) => (
              <div key={deal.id} className="border-l-2 border-l-destructive bg-destructive/5 px-3 py-2.5 rounded-r-md flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">{client.name} <Badge className={clientStatusColor[client.status] + " ml-1"}>{client.status}</Badge></div>
                  <div className="text-[12px] text-foreground/80 mt-0.5">
                    У клиента уже есть просрочка <span className="num font-semibold text-destructive">{formatShort(client.overdue)} ₽</span> ({client.maxOverdueDays} дн). Новая сделка <span className="num font-semibold">{formatShort(deal.amount)} ₽</span> · {deal.paymentTerms} требует согласования с финдиректором.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}


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
