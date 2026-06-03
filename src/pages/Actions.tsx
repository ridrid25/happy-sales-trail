import { actions, deals, clients } from "@/data/demo";
import { Card, PageHeader, Stat, Badge } from "@/components/ui-bits";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

const stagnant = deals.filter(d => !["Выиграна", "Потеряна"].includes(d.stage)).slice(0, 6);

export default function Actions() {
  const overdueA = actions.filter(a => a.overdue);
  const today = actions.filter(a => a.due === "сегодня");

  return (
    <>
      <PageHeader title="Контроль действий" subtitle="Что не сделано и где остановилась работа" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Задач на сегодня" value={today.length} icon={<Clock className="h-4 w-4 text-accent" />} />
        <Stat label="Просроченные" value={overdueA.length} tone="danger" icon={<AlertCircle className="h-4 w-4 text-destructive" />} />
        <Stat label="Сделки без следующего шага" value={stagnant.length} tone="warning" />
        <Stat label="Клиентов без follow-up" value={clients.filter(c => c.status !== "надёжный").length} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Задачи и действия">
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className={`p-3 border border-border rounded-md flex items-start justify-between gap-3 ${a.overdue ? "bg-destructive/5 border-destructive/30" : ""}`}>
                <div className="flex items-start gap-2">
                  {a.overdue
                    ? <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    : <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                  <div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.owner} · {a.due}</div>
                  </div>
                </div>
                <Badge className={
                  a.priority === "Высокий" ? "bg-destructive/10 text-destructive border-destructive/20"
                  : a.priority === "Средний" ? "bg-warning/10 text-warning border-warning/30"
                  : "bg-muted text-muted-foreground border-border"
                }>{a.priority}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Сделки без движения">
            <div className="space-y-2 text-sm">
              {stagnant.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium">{d.client}</div>
                    <div className="text-[11px] text-muted-foreground">{d.manager} · {d.stage}</div>
                  </div>
                  <div className="text-[11px] text-warning">нет действия</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Клиенты с просрочкой без действия">
            <div className="space-y-2 text-sm">
              {clients.filter(c => c.overdue > 0).map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.manager}</div>
                  </div>
                  <div className="text-[11px] text-destructive">{c.maxOverdueDays} дн просрочки</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
