import { useMemo, useState } from "react";
import { managers, clients, deals, formatShort, totalReceivable, overdueReceivable, avgPaymentDays, riskColor, clientStatusColor, totalHoldingCost, FINANCING_RATE, HOLDING_COST_EXPLAINER, dealHoldingCost, clientHoldingCost, managerHoldingCost } from "@/data/demo";
import { Card, PageHeader, Stat, Badge, ProgressBar } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, CheckSquare, Phone, ShieldOff, FileText, Handshake, Info, ChevronDown, Search, Target, Lightbulb } from "lucide-react";

type AgingBucket = {
  key: string;
  label: string;
  min: number;
  max: number; // inclusive; Infinity for last
  tone: "success" | "warning" | "danger" | "default";
};

const BUCKETS: AgingBucket[] = [
  { key: "in_term", label: "В срок", min: 0, max: 0, tone: "success" },
  { key: "1_15", label: "1–15 дн", min: 1, max: 15, tone: "default" },
  { key: "16_30", label: "16–30 дн", min: 16, max: 30, tone: "warning" },
  { key: "31_60", label: "31–60 дн", min: 31, max: 60, tone: "danger" },
  { key: "60p", label: "60+ дн", min: 61, max: Infinity, tone: "danger" },
];

// причины: ключ -> описание / владелец / действие
const CAUSE_MAP: Record<string, { label: string; owner: string; action: string }> = {
  "клиент задерживает оплату": { label: "Клиент задерживает оплату", owner: "РОП + менеджер", action: "Позвонить и зафиксировать дату оплаты" },
  "клиент не платит без причины": { label: "Клиент не платит без причины", owner: "РОП + финансы", action: "Эскалация, претензия, стоп отгрузки" },
  "клиент изначально рискованный": { label: "Изначально рискованный клиент", owner: "Финдиректор + РОП", action: "Перевести на предоплату 50–100%" },
  "менеджер дал слабые условия": { label: "Слабые условия от менеджера", owner: "РОП", action: "Пересогласовать условия, ввести лимит скидки" },
  "документы не выставлены вовремя": { label: "Документы не закрыты", owner: "Бухгалтерия + менеджер", action: "Закрыть документы до пятницы" },
  "закрывающие документы не подписаны": { label: "Документы не подписаны", owner: "Юрист + менеджер", action: "Получить подписи, отправить курьером" },
  "смешанная причина": { label: "Смешанная причина", owner: "РОП", action: "Разобрать сделку, назначить владельца" },
};

function bucketOf(days: number): AgingBucket {
  return BUCKETS.find(b => days >= b.min && days <= b.max)!;
}

export default function Receivables() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCause, setFilterCause] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [onlyOld, setOnlyOld] = useState(false);

  const clientsOverdue = clients.filter(c => c.overdue > 0);
  const overduePct = Math.round(overdueReceivable / totalReceivable * 100);

  // ===== Aging по сделкам с непогашенным остатком =====
  const aging = useMemo(() => {
    const buckets = BUCKETS.map(b => ({ ...b, amount: 0, clients: new Set<string>(), dealCount: 0 }));
    // current (in-term) — берём дебиторку клиентов минус их просрочка
    const inTermTotal = totalReceivable - overdueReceivable;
    buckets[0].amount = inTermTotal;
    clients.forEach(c => {
      if (c.receivable - c.overdue > 0) buckets[0].clients.add(c.name);
    });
    // overdue по сделкам
    deals.filter(d => d.overdueDays > 0 && d.unpaid > 0).forEach(d => {
      const b = bucketOf(d.overdueDays);
      const idx = buckets.findIndex(x => x.key === b.key);
      if (idx >= 0) {
        buckets[idx].amount += d.unpaid;
        buckets[idx].clients.add(d.client);
        buckets[idx].dealCount += 1;
      }
    });
    return buckets;
  }, []);

  // ===== Концентрация: топ клиентов =====
  const topClients = useMemo(() => {
    return [...clientsOverdue].sort((a, b) => b.overdue - a.overdue);
  }, [clientsOverdue]);
  const top5ShareOfOverdue = useMemo(() => {
    const sum = topClients.slice(0, 5).reduce((s, c) => s + c.overdue, 0);
    return overdueReceivable ? Math.round(sum / overdueReceivable * 100) : 0;
  }, [topClients]);
  const topManagers = useMemo(() => {
    return [...managers].filter(m => m.overdue > 0).sort((a, b) => b.overdue - a.overdue).slice(0, 5);
  }, []);

  // ===== Причины просрочки =====
  const causes = useMemo(() => {
    const map = new Map<string, { amount: number; count: number; clients: Set<string> }>();
    deals.filter(d => d.overdueDays > 0 && d.unpaid > 0 && d.cause).forEach(d => {
      const key = d.cause!;
      const e = map.get(key) ?? { amount: 0, count: 0, clients: new Set<string>() };
      e.amount += d.unpaid;
      e.count += 1;
      e.clients.add(d.client);
      map.set(key, e);
    });
    return [...map.entries()]
      .map(([k, v]) => ({ key: k, ...CAUSE_MAP[k] ?? { label: k, owner: "—", action: "Разобрать" }, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, []);

  // ===== Матрица «долг × дисциплина» =====
  const matrix = useMemo(() => {
    const big = 500_000; // порог крупного долга
    const badDays = 30;
    const cells = {
      bigReliable: [] as typeof clientsOverdue,
      bigRisk: [] as typeof clientsOverdue,
      smallChronic: [] as typeof clientsOverdue,
      lowPrio: [] as typeof clientsOverdue,
    };
    clientsOverdue.forEach(c => {
      const isBig = c.overdue >= big;
      const isBad = c.maxOverdueDays >= badDays;
      if (isBig && !isBad) cells.bigReliable.push(c);
      else if (isBig && isBad) cells.bigRisk.push(c);
      else if (!isBig && isBad) cells.smallChronic.push(c);
      else cells.lowPrio.push(c);
    });
    return cells;
  }, [clientsOverdue]);

  // ===== Полная детализация: фильтры по сделкам с overdue =====
  const detailRows = useMemo(() => {
    let rows = deals.filter(d => d.overdueDays > 0 && d.unpaid > 0);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(d => d.client.toLowerCase().includes(q) || d.manager.toLowerCase().includes(q));
    }
    if (filterCause !== "all") rows = rows.filter(d => d.cause === filterCause);
    if (filterStatus !== "all") {
      rows = rows.filter(d => clients.find(c => c.name === d.client)?.status === filterStatus);
    }
    if (onlyOld) rows = rows.filter(d => d.overdueDays >= 60);
    return rows.sort((a, b) => b.unpaid - a.unpaid);
  }, [search, filterCause, filterStatus, onlyOld]);

  const oldShare = useMemo(() => {
    const old = aging.find(b => b.key === "60p")?.amount ?? 0;
    return overdueReceivable ? Math.round(old / overdueReceivable * 100) : 0;
  }, [aging]);

  return (
    <>
      <PageHeader back={{ to: "/", label: "Дашборд" }} title="Дебиторка: деньги и просрочка" subtitle="Состояние оплат, концентрация риска, причины и действия" />

      {/* 1. Мини-дашборд */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Дебиторка" value={formatShort(totalReceivable) + " ₽"} hint="итого по компании" />
        <Stat label="Просрочено из неё" value={formatShort(overdueReceivable) + " ₽"} tone="danger" hint={`${overduePct}% от дебиторки`} />
        <Stat label="Стоимость просрочки" value={formatShort(totalHoldingCost) + " ₽"} tone="danger" hint={`ставка ${Math.round(FINANCING_RATE*100)}% годовых`} />
        <Stat label="Доля 60+ дней" value={oldShare + "%"} tone={oldShare > 20 ? "danger" : "warning"} hint="от просрочки" />
        <Stat label="Средний срок оплаты" value={avgPaymentDays + " дн"} tone="warning" hint="норма 21 дн" />
        <Stat label="Клиентов с просрочкой" value={clientsOverdue.length} />
        <Stat label="Топ-5 клиентов" value={top5ShareOfOverdue + "%"} tone="warning" hint="от просрочки" />
        <Stat label="Сделок в просрочке" value={deals.filter(d => d.overdueDays > 0 && d.unpaid > 0).length} />
      </div>

      {/* HOLDING COST EXPLAINER */}
      <div className="mb-4 text-[12px] text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
        <span>{HOLDING_COST_EXPLAINER}</span>
      </div>

      {/* 2. Главный вывод */}
      <Card className="mb-4 border-l-4 border-l-accent">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold mb-1">Главный вывод</div>
            <div className="text-foreground/85">
              {top5ShareOfOverdue}% просрочки дают {Math.min(5, topClients.length)} клиентов. Основной риск — долги старше 30 дней и клиенты со статусом «риск/стоп». Фокус на этих клиентах даст максимальный денежный эффект — полный список должников на первом экране не нужен.
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Что сделать сегодня */}
      <Card title={<span className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-accent" /> Что сделать сегодня</span>} subtitle="Конкретные действия с эффектом, владельцем и сроком" className="mb-4">
        <div className="grid md:grid-cols-2 gap-2">
          <TodoItem icon={<Phone className="h-4 w-4" />} priority="критично" text="Разобрать топ-5 долгов" detail="«Альфа Логистика», «ТрейдГранд», «Лига Ритейл», «СтудияМаркет», «Полюс Тех»" amount="до 1,82 млн ₽ поступлений" owner="РОП + менеджеры" due="сегодня" />
          <TodoItem icon={<ShieldOff className="h-4 w-4" />} priority="критично" text="Остановить новые отгрузки 2 клиентам со статусом «стоп»" detail="«Альфа Логистика» — заявка 580 тыс ₽ с отсрочкой 14 дн" amount="не увеличить долг на 700 тыс ₽" owner="Финансы + РОП" due="сегодня" />
          <TodoItem icon={<FileText className="h-4 w-4" />} priority="контроль" text="Закрыть документы по 3 сделкам" detail="«Полюс Тех», «Лига Ритейл» — документы не выставлены / не подписаны" amount="разблокировать 1,1 млн ₽" owner="Бухгалтерия + менеджер" due="2 дня" />
          <TodoItem icon={<Handshake className="h-4 w-4" />} priority="контроль" text="Согласовать новые условия оплаты по 4 клиентам" detail="Перевод на предоплату 50% по клиентам «риск»" amount="снизить риск повторной просрочки" owner="CFO / РОП" due="неделя" />
        </div>
      </Card>

      {/* 4. Aging */}
      <Card title="Возраст дебиторки" subtitle="Распределение по срокам просрочки" className="mb-4">
        <div className="space-y-2.5">
          {aging.map(b => {
            const pct = totalReceivable ? Math.round(b.amount / totalReceivable * 100) : 0;
            return (
              <div key={b.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.label}</span>
                    <span className="text-[11px] text-muted-foreground">· {b.clients.size} клиентов</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="num font-semibold">{formatShort(b.amount)} ₽</span>
                    <span className="text-[11px] text-muted-foreground w-9 text-right">{pct}%</span>
                  </div>
                </div>
                <ProgressBar value={pct} tone={b.tone === "default" ? "accent" : b.tone === "success" ? "success" : b.tone === "warning" ? "warning" : "danger"} />
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[12px] text-muted-foreground">
          Длинный хвост 60+ дней — {oldShare}% просрочки. Эти деньги дороже всего: они дольше всего «зависли» в обороте.
        </div>
      </Card>

      {/* 5. Концентрация риска */}
      <Card title="Кто формирует просрочку" subtitle="Концентрация: не все клиенты, а где сосредоточен риск" className="mb-4">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="text-[11px] uppercase text-muted-foreground mb-2">Топ клиенты по просрочке</div>
            <ConcentrationList items={topClients.slice(0, 10).map(c => ({
              name: c.name,
              meta: `${c.manager} · ${c.maxOverdueDays} дн · ${c.status}`,
              amount: c.overdue,
              statusColor: clientStatusColor[c.status],
              status: c.status,
            }))} total={overdueReceivable} />
          </div>
          <div>
            <div className="text-[11px] uppercase text-muted-foreground mb-2">Топ менеджеры по просрочке</div>
            <ConcentrationList items={topManagers.map(m => ({
              name: m.name,
              meta: `${m.title} · риск: ${m.risk}`,
              amount: m.overdue,
              statusColor: riskColor[m.risk],
              status: m.risk,
            }))} total={overdueReceivable} />
          </div>
        </div>
        <div className="mt-4 text-sm bg-warning/10 border border-warning/30 rounded-md px-3 py-2 flex items-start gap-2">
          <Target className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Топ-5 клиентов дают {top5ShareOfOverdue}% просрочки.</span>{" "}
            <span className="text-foreground/80">Разбор этих клиентов = максимальный денежный эффект.</span>
          </div>
        </div>
      </Card>

      {/* 6. Причины просрочки */}
      <Card title="Почему зависли деньги" subtitle="Группировка просрочки по причинам и владельцам" className="mb-4">
        <div className="grid md:grid-cols-2 gap-3">
          {causes.map(c => (
            <div key={c.key} className="border border-border rounded-md p-3 bg-card">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="font-medium text-sm">{c.label}</div>
                <div className="num font-semibold text-destructive whitespace-nowrap">{formatShort(c.amount)} ₽</div>
              </div>
              <div className="text-[11px] text-muted-foreground mb-2">{c.count} сделок · {c.clients.size} клиентов</div>
              <div className="text-[12px] grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                <span className="text-muted-foreground">Владелец:</span><span>{c.owner}</span>
                <span className="text-muted-foreground">Действие:</span><span className="text-foreground">{c.action}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. Матрица */}
      <Card title="Матрица клиентов: долг × дисциплина оплаты" subtitle="Сегменты для приоритизации работы" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MatrixCell title="Крупный риск" tone="danger" desc="Большой долг + нарушает сроки" items={matrix.bigRisk} action="Стоп отгрузка, перевод на предоплату, эскалация" />
          <MatrixCell title="Крупный надёжный" tone="warning" desc="Большой долг, но платит в пределах нормы" items={matrix.bigReliable} action="Контроль follow-up, не наращивать лимит" />
          <MatrixCell title="Малый хронический должник" tone="warning" desc="Сумма небольшая, но регулярная просрочка" items={matrix.smallChronic} action="Пересмотреть условия, ввести предоплату" />
          <MatrixCell title="Низкий приоритет" tone="default" desc="Маленький долг, нет критичного риска" items={matrix.lowPrio} action="Стандартный follow-up" />
        </div>
      </Card>

      {/* 9. Полная детализация — collapsible */}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Card title="Полная детализация" subtitle="Все сделки в просрочке. Используйте поиск и фильтры." action={
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {detailsOpen ? "Свернуть" : "Показать детализацию"}
              <ChevronDown className={`h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        }>
          <CollapsibleContent>
            {/* Фильтры */}
            <div className="flex flex-col md:flex-row gap-2 mb-3">
              <div className="relative md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Клиент или менеджер" className="pl-8 h-9" />
              </div>
              <select value={filterCause} onChange={e => setFilterCause(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="all">Все причины</option>
                {Object.keys(CAUSE_MAP).map(k => <option key={k} value={k}>{CAUSE_MAP[k].label}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="all">Все статусы клиентов</option>
                <option value="надёжный">надёжный</option>
                <option value="контроль">контроль</option>
                <option value="риск">риск</option>
                <option value="стоп">стоп</option>
              </select>
              <label className="flex items-center gap-2 text-sm px-2">
                <input type="checkbox" checked={onlyOld} onChange={e => setOnlyOld(e.target.checked)} />
                Только 60+ дней
              </label>
            </div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                    <Th>Клиент</Th><Th>Менеджер</Th><Th right>Долг по сделке</Th><Th right>Дней</Th><Th right>Стоимость</Th>
                    <Th>Причина</Th><Th>Владелец</Th><Th right>Статус</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detailRows.map(d => {
                    const c = clients.find(cl => cl.name === d.client);
                    const cause = d.cause ? CAUSE_MAP[d.cause] : undefined;
                    return (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="py-2.5 px-2 font-medium">{d.client}</td>
                        <td className="py-2.5 px-2 text-muted-foreground">{d.manager}</td>
                        <Td className="font-semibold">{formatShort(d.unpaid)}</Td>
                        <Td className={d.overdueDays >= 30 ? "text-destructive" : "text-warning"}>{d.overdueDays}</Td>
                        <Td className="text-destructive">{formatShort(dealHoldingCost(d))} ₽</Td>
                        <td className="py-2.5 px-2 text-[12px]">{cause?.label ?? d.cause ?? "—"}</td>
                        <td className="py-2.5 px-2 text-[12px] text-muted-foreground">{cause?.owner ?? d.responsible ?? "—"}</td>
                        <td className="py-2.5 px-2 text-right">{c && <Badge className={clientStatusColor[c.status]}>{c.status}</Badge>}</td>
                      </tr>
                    );
                  })}
                  {detailRows.length === 0 && (
                    <tr><td colSpan={8} className="py-6 text-center text-muted-foreground text-sm">Нет сделок по выбранным фильтрам</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`font-medium pb-2 px-2 whitespace-nowrap ${right ? "text-right" : ""}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2.5 px-2 text-right num ${className}`}>{children}</td>;
}

function ConcentrationList({ items, total }: { items: { name: string; meta: string; amount: number; statusColor: string; status: string }[]; total: number }) {
  if (!items.length) return <div className="text-sm text-muted-foreground">Нет данных</div>;
  return (
    <div className="space-y-2">
      {items.map(it => {
        const pct = total ? Math.round(it.amount / total * 100) : 0;
        return (
          <div key={it.name} className="border-b border-border last:border-0 pb-2 last:pb-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{it.name} <Badge className={it.statusColor + " ml-1"}>{it.status}</Badge></div>
                <div className="text-[11px] text-muted-foreground truncate">{it.meta}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="num font-semibold text-destructive">{formatShort(it.amount)} ₽</div>
                <div className="text-[10px] text-muted-foreground">{pct}% просрочки</div>
              </div>
            </div>
            <ProgressBar value={pct} tone="danger" />
          </div>
        );
      })}
    </div>
  );
}

function MatrixCell({ title, tone, desc, items, action }: {
  title: string; tone: "danger" | "warning" | "default"; desc: string;
  items: { id: string; name: string; overdue: number; maxOverdueDays: number }[]; action: string;
}) {
  const border = tone === "danger" ? "border-l-destructive" : tone === "warning" ? "border-l-warning" : "border-l-border";
  const sum = items.reduce((s, c) => s + c.overdue, 0);
  return (
    <div className={`border-l-4 ${border} bg-card border border-border rounded-md p-3`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-[11px] text-muted-foreground">{items.length} клиентов</div>
      </div>
      <div className="text-[12px] text-muted-foreground mb-2">{desc}</div>
      <div className="num font-semibold text-base mb-2">{formatShort(sum)} ₽ просрочки</div>
      {items.length > 0 && (
        <div className="text-[12px] mb-2 space-y-0.5">
          {items.slice(0, 2).map(c => (
            <div key={c.id} className="flex justify-between gap-2">
              <span className="truncate">{c.name}</span>
              <span className="num text-muted-foreground shrink-0">{formatShort(c.overdue)} · {c.maxOverdueDays} дн</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-[11px] text-foreground/80 border-t border-border pt-2 mt-1">
        <span className="text-muted-foreground">Действие: </span>{action}
      </div>
    </div>
  );
}

function TodoItem({ icon, text, detail, amount, priority, owner, due }: { icon: React.ReactNode; text: string; detail: string; amount: string; priority: "критично" | "контроль"; owner: string; due: string }) {
  const cls = priority === "критично" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5";
  const badgeCls = priority === "критично" ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-warning/10 text-warning border-warning/30";
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
      <div className="text-[11px] num font-semibold text-foreground/80 pl-6 mt-1">Эффект: {amount}</div>
      <div className="text-[11px] text-muted-foreground pl-6">Владелец: {owner} · Срок: {due}</div>
    </div>
  );
}
