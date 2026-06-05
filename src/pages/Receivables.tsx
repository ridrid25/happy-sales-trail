import { managers, clients, deals, formatShort, totalReceivable, overdueReceivable, avgPaymentDays, forecastIncoming, riskColor, clientStatusColor, planPayments, factPayments, cashGap, plannedOutflow, totalHoldingCost, avgHoldingCostPerClient, topClientsByHoldingCost, managerHoldingCost, clientHoldingCost, dealHoldingCost, FINANCING_RATE, HOLDING_COST_EXPLAINER } from "@/data/demo";
import { Card, PageHeader, Stat, Badge } from "@/components/ui-bits";
import { AlertTriangle, CheckSquare, Phone, ShieldOff, FileText, Handshake, Info } from "lucide-react";

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Общая дебиторка" value={formatShort(totalReceivable) + " ₽"} />
        <Stat label="Просроченная" value={formatShort(overdueReceivable) + " ₽"} tone="danger" hint={`${Math.round(overdueReceivable/totalReceivable*100)}% от дебиторки`} />
        <Stat label="Стоимость просрочки" value={formatShort(totalHoldingCost) + " ₽"} tone="danger" hint={`ставка ${Math.round(FINANCING_RATE*100)}% годовых`} />
        <Stat label="Сред. стоимость на клиента" value={formatShort(avgHoldingCostPerClient) + " ₽"} tone="warning" hint="среди клиентов с просрочкой" />
        <Stat label="Средний срок оплаты" value={avgPaymentDays + " дн"} tone="warning" hint="норма 21 дн" />
        <Stat label="Прогноз поступлений" value={formatShort(forecastIncoming) + " ₽"} tone="warning" hint={`план ${formatShort(planPayments)} ₽`} />
        <Stat label="Клиентов с просрочкой" value={clientsOverdue.length} />
        <Stat label="Риск кассового разрыва" value={formatShort(cashGap) + " ₽"} tone="danger" hint={`обязательства ${formatShort(plannedOutflow)} ₽`} />
      </div>

      {/* Пояснение по стоимости просрочки */}
      <div className="mb-6 text-[12px] text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
        <span>{HOLDING_COST_EXPLAINER}</span>
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

      {/* Что делать сегодня */}
      <Card title={<span className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-accent" /> Что делать сегодня</span>} subtitle="Конкретные действия для сбора дебиторки и снижения риска" className="mb-4">
        <div className="grid md:grid-cols-2 gap-2">
          <TodoItem icon={<Phone className="h-4 w-4" />} priority="критично" text="Связаться с 3 клиентами с просрочкой > 30 дн" detail="«Альфа Логистика» (38 дн), «ТрейдГранд» (44 дн), «Лига Ритейл» (51 дн)" amount="1,82 млн ₽" />
          <TodoItem icon={<ShieldOff className="h-4 w-4" />} priority="критично" text="Остановить новую отгрузку клиенту со статусом «стоп»" detail="«Альфа Логистика» — заявка на 580 тыс ₽ с отсрочкой 14 дн" amount="580 тыс ₽" />
          <TodoItem icon={<Handshake className="h-4 w-4" />} priority="контроль" text="Согласовать условия оплаты по клиенту с просрочкой" detail="«Полюс Тех» — частичная оплата, задержка 14 дн. Перевести на предоплату 50%" amount="520 тыс ₽" />
          <TodoItem icon={<FileText className="h-4 w-4" />} priority="контроль" text="Проверить документы по сделкам, где оплата задерживается" detail="2 сделки: «Лига Ритейл», «Полюс Тех» — закрывающие документы не подписаны" amount="670 тыс ₽" />
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

      {/* Топ-5 клиентов по стоимости просрочки */}
      <Card title="Топ-5 клиентов по стоимости просрочки" subtitle="Где сосредоточена стоимость зависших денег" className="mb-4">
        <div className="space-y-2">
          {topClientsByHoldingCost(5).map(({ client, cost }) => (
            <div key={client.id} className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0">
              <div>
                <div className="font-medium text-sm">{client.name} <Badge className={clientStatusColor[client.status] + " ml-1"}>{client.status}</Badge></div>
                <div className="text-[11px] text-muted-foreground">просрочка {formatShort(client.overdue)} ₽ · {client.maxOverdueDays} дн · менеджер {client.manager}</div>
              </div>
              <div className="text-right">
                <div className="num font-semibold text-destructive">{formatShort(cost)} ₽</div>
                <div className="text-[10px] text-muted-foreground">стоимость просрочки</div>
              </div>
            </div>
          ))}
        </div>
      </Card>


      <Card title="Дебиторка по менеджерам" className="mb-4">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                <Th>Менеджер</Th><Th right>Выручка</Th><Th right>Оплачено</Th>
                <Th right>Дебиторка</Th><Th right>Просрочка</Th><Th right>Стоимость просрочки</Th><Th right>Доля просрочки</Th>
                <Th right>Срок оплаты</Th><Th right>Клиентов с проср.</Th><Th right>Статус</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {managers.map((m) => {
                const overdueShare = Math.round(m.overdue / Math.max(m.fact, 1) * 100);
                const clientsCount = clients.filter(c => c.manager === m.name && c.overdue > 0).length;
                const mHC = managerHoldingCost(m.name);
                return (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-2 font-medium">{m.name}</td>
                    <Td>{formatShort(m.fact)}</Td>
                    <Td className="text-success">{formatShort(m.paid)}</Td>
                    <Td>{formatShort(m.receivable)}</Td>
                    <Td className={m.overdue > 500_000 ? "text-destructive font-semibold" : m.overdue > 0 ? "text-warning" : ""}>{formatShort(m.overdue)}</Td>
                    <Td className={mHC > 30_000 ? "text-destructive font-semibold" : mHC > 0 ? "text-warning" : ""}>{mHC > 0 ? formatShort(mHC) + " ₽" : "—"}</Td>
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

function TodoItem({ icon, text, detail, amount, priority }: { icon: React.ReactNode; text: string; detail: string; amount: string; priority: "критично" | "контроль" }) {
  const cls = priority === "критично"
    ? "border-l-destructive bg-destructive/5"
    : "border-l-warning bg-warning/5";
  const badgeCls = priority === "критично"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : "bg-warning/10 text-warning border-warning/30";
  return (
    <div className={`border-l-2 ${cls} px-3 py-2.5 rounded-r-md`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-2">
          <span className="text-accent mt-0.5">{icon}</span>
          <div className="text-sm font-semibold leading-snug">{text}</div>
        </div>
        <Badge className={`${badgeCls} shrink-0`}>{priority}</Badge>
      </div>
      <div className="text-[12px] text-muted-foreground pl-6">{detail}</div>
      <div className="text-[11px] num font-semibold text-foreground/80 pl-6 mt-0.5">{amount}</div>
    </div>
  );
}
