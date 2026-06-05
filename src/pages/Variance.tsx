import { varianceAnalysis, deals, holdingCostVariance, formatShort, totalHoldingCost, HOLDING_COST_EXPLAINER } from "@/data/demo";
import { Card, PageHeader, Badge } from "@/components/ui-bits";
import { AlertTriangle, Info, Wallet } from "lucide-react";

const causeResponsibility = [
  { cause: "Менеджер дал слабые условия оплаты", responsible: "Менеджер" },
  { cause: "Клиент изначально рискованный", responsible: "Менеджер / РОП" },
  { cause: "Документы не выставлены вовремя", responsible: "Бухгалтерия" },
  { cause: "Закрывающие документы не подписаны", responsible: "Юрист" },
  { cause: "Компания плохо выполнила обязательства", responsible: "Производство / Логистика" },
  { cause: "Клиент не платит без причины", responsible: "Клиент" },
  { cause: "Смешанная причина", responsible: "Смешанная ответственность" },
];

export default function Variance() {
  const overdueDeals = deals.filter(d => d.overdueDays > 0 && d.cause);

  return (
    <>
      <PageHeader title="Аналитика отклонений" subtitle="Что не так, почему и что делать" />

      <div className="space-y-3">
        {varianceAnalysis.map((v, i) => (
          <Card key={i}>
            <div className="grid lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <h3 className="font-display font-semibold text-base">{v.area}</h3>
                </div>
                <div className="text-[11px] text-muted-foreground">{v.metric}</div>
              </div>
              <div className="lg:col-span-2">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Отклонение</div>
                <div className="num font-semibold text-destructive">{v.deviation}</div>
              </div>
              <div className="lg:col-span-3">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Причина</div>
                <div className="text-sm">{v.cause}</div>
              </div>
              <div className="lg:col-span-3">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Действие</div>
                <div className="text-sm font-medium text-foreground">{v.action}</div>
              </div>
              <div className="lg:col-span-1">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Владелец</div>
                <Badge className="bg-accent/10 text-accent border-accent/20">{v.owner}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card title="Разделение ответственности за просрочку">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                <th className="font-medium pb-2">Причина</th>
                <th className="font-medium pb-2">Ответственный</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {causeResponsibility.map((r, i) => (
                <tr key={i}>
                  <td className="py-2">{r.cause}</td>
                  <td className="py-2 text-muted-foreground">{r.responsible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Просрочки по сделкам — причины и ответственность">
          <div className="space-y-2 text-sm">
            {overdueDeals.slice(0, 8).map((d) => (
              <div key={d.id} className="border-b border-border last:border-0 pb-2 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{d.client}</div>
                  <div className="text-[11px] text-destructive num">{d.overdueDays} дн</div>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Причина: {d.cause} · Ответственный: <span className="capitalize">{d.responsible}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Почему выросла стоимость просрочки */}
      <Card
        className="mt-6"
        title={<span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-accent" /> Почему выросла стоимость просрочки</span>}
        subtitle={`Общая стоимость зависших денег ≈ ${formatShort(totalHoldingCost)} ₽`}
      >
        <div className="mb-3 text-[12px] text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
          <span>{HOLDING_COST_EXPLAINER}</span>
        </div>
        <div className="space-y-3">
          {holdingCostVariance.map((h, i) => (
            <div key={i} className="border-l-2 border-l-destructive bg-destructive/5 px-4 py-3 rounded-r-md">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-semibold text-sm">{h.problem}</div>
                <Badge className="bg-destructive/10 text-destructive border-destructive/30 shrink-0">{formatShort(h.holdingCost)} ₽</Badge>
              </div>
              <div className="grid md:grid-cols-5 gap-x-4 gap-y-1 text-[12px]">
                <Field label="Сумма просрочки" value={`${formatShort(h.overdueAmount)} ₽`} />
                <Field label="Дней просрочки" value={`${h.overdueDays} дн`} />
                <Field label="Ставка" value={h.rate} />
                <Field label="Стоимость" value={`${formatShort(h.holdingCost)} ₽`} tone="danger" />
                <Field label="Владелец" value={h.owner} />
              </div>
              <div className="text-[12px] text-foreground/80 mt-2">
                <span className="text-muted-foreground">Причина:</span> {h.cause}
              </div>
              <div className="text-[12px] text-foreground/90 mt-1 border-t border-border/60 pt-2">
                <span className="text-muted-foreground">Действие:</span> {h.action}
              </div>
            </div>
          ))}
        </div>
      </Card>


      <Card className="mt-4" title="Правила статусов риска">
        <div className="grid lg:grid-cols-3 gap-4 text-sm">
          <div>
            <Badge className="bg-success/10 text-success border-success/20 mb-2">норма</Badge>
            <ul className="space-y-1 text-foreground/85">
              <li>• план выполняется</li>
              <li>• маржа не ниже целевой</li>
              <li>• просрочка в допустимых пределах</li>
              <li>• оплата поступает вовремя</li>
            </ul>
          </div>
          <div>
            <Badge className="bg-warning/10 text-warning border-warning/30 mb-2">контроль</Badge>
            <ul className="space-y-1 text-foreground/85">
              <li>• есть отставание по плану</li>
              <li>• маржа ниже нормы</li>
              <li>• часть клиентов задерживает оплату</li>
              <li>• просрочка растёт</li>
            </ul>
          </div>
          <div>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 mb-2">критично</Badge>
            <ul className="space-y-1 text-foreground/85">
              <li>• выполнение плана ниже 70%</li>
              <li>• высокая просрочка</li>
              <li>• низкая маржа</li>
              <li>• большая часть выручки не оплачена</li>
              <li>• есть риск кассового разрыва</li>
            </ul>
          </div>
        </div>
      </Card>
    </>
  );
}
