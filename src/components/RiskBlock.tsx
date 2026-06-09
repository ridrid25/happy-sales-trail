import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, Badge } from "@/components/ui-bits";
import {
  redFlags, managers, formatShort, cashGap, riskStructure, riskCauses,
  riskSources, priorityActions, riskCounterDetails, RiskSeverity,
} from "@/data/demo";
import {
  ShieldAlert, ChevronDown, ArrowRightCircle, AlertTriangle, ListChecks,
  Layers, Users, Target,
} from "lucide-react";

const sevDot = (s: RiskSeverity) =>
  s === "critical" ? "bg-destructive" : s === "control" ? "bg-warning" : "bg-accent";
const sevText = (s: RiskSeverity) =>
  s === "critical" ? "text-destructive" : s === "control" ? "text-warning" : "text-accent";
const sevBorder = (s: RiskSeverity) =>
  s === "critical" ? "border-l-destructive bg-destructive/[0.05] dark:bg-destructive/10"
  : s === "control" ? "border-l-warning bg-warning/[0.05] dark:bg-warning/10"
  : "border-l-accent bg-accent/[0.05] dark:bg-accent/10";
const sevBadge = (s: RiskSeverity) =>
  s === "critical" ? "bg-destructive/10 text-destructive border-destructive/30"
  : s === "control" ? "bg-warning/10 text-warning border-warning/30"
  : "bg-accent/10 text-accent border-accent/30";
const sevLabel = (s: RiskSeverity) => s === "critical" ? "критично" : s === "control" ? "контроль" : "наблюдение";

/* ============ Block: Сводка (управленческий) ============ */
type CounterKey = "flags" | "problemClients" | "overdueClients" | "stagnantDeals" | "riskManagers";

const sourceItems: {
  key: CounterKey;
  label: string;
  hint: string;
  cta: string;
  tone: "danger" | "warning";
  getValue: () => number;
}[] = [
  { key: "flags", label: "Критичные сигналы", hint: "Требуют решения сегодня", cta: "Смотреть сигналы →", tone: "danger",
    getValue: () => redFlags.filter(f => f.severity === "high").length },
  { key: "problemClients", label: "Проблемные клиенты", hint: "Создают риск оплат", cta: "Смотреть клиентов →", tone: "danger",
    getValue: () => riskCounterDetails.problemClients.length },
  { key: "overdueClients", label: "Просрочка", hint: "Долги с нарушением срока", cta: "Разобрать долги →", tone: "danger",
    getValue: () => riskCounterDetails.overdueClients.length },
  { key: "stagnantDeals", label: "Сделки без движения", hint: "Нет следующего шага", cta: "Назначить действия →", tone: "warning",
    getValue: () => riskCounterDetails.stagnantDeals.length },
];

function MainRiskCard() {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/[0.06] dark:bg-destructive/10 px-3.5 py-3">
      <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Главный риск</div>
      <div className="flex items-baseline justify-between gap-2 mt-0.5">
        <div className="text-[13px] font-semibold">Кассовый разрыв</div>
        <div className="num font-display font-bold text-lg text-destructive">−{formatShort(cashGap)} ₽</div>
      </div>
      <div className="text-[11.5px] mt-1.5">
        <span className="text-muted-foreground">Почему: </span>
        просрочка 3 млн ₽ + неоплачено 7,2 млн ₽
      </div>
      <div className="flex items-start gap-1.5 text-[11.5px] mt-1 pt-1.5 border-t border-destructive/20">
        <ArrowRightCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
        <span><span className="text-muted-foreground">Что сделать: </span>разобрать 3 крупнейших долга сегодня</span>
      </div>
    </div>
  );
}

function SourceTile({ item, onOpen }: { item: typeof sourceItems[number]; onOpen: (k: CounterKey) => void }) {
  return (
    <button
      onClick={() => onOpen(item.key)}
      className="relative text-left rounded-md border border-border bg-card px-3 py-2.5 overflow-hidden hover:border-accent/50 active:bg-muted/40 transition-colors flex flex-col"
    >
      <span className={cn("absolute left-0 top-0 bottom-0 w-0.5", item.tone === "danger" ? "bg-destructive" : "bg-warning")} />
      <div className="text-[11px] font-medium leading-tight">{item.label}</div>
      <div className={cn("num font-display font-semibold text-xl leading-tight mt-0.5",
        item.tone === "danger" ? "text-destructive" : "text-warning")}>
        {item.getValue()}
      </div>
      <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight">{item.hint}</div>
      <div className="text-[10.5px] text-accent mt-1.5 leading-tight">{item.cta}</div>
    </button>
  );
}

function ManagersAttentionRow({ onOpen }: { onOpen: (k: CounterKey) => void }) {
  const count = riskCounterDetails.riskManagers.length;
  return (
    <button
      onClick={() => onOpen("riskManagers")}
      className="w-full text-left rounded-md border border-border bg-card px-3 py-2.5 hover:border-accent/50 active:bg-muted/40 transition-colors flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Users className="h-4 w-4 text-warning shrink-0" />
        <div className="min-w-0">
          <div className="text-[12px] font-medium leading-tight">Менеджеры в зоне внимания</div>
          <div className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">
            {count} {count === 1 ? "менеджер связан" : "менеджера связаны"} с рисками оплат
          </div>
        </div>
      </div>
      <div className="text-[10.5px] text-accent shrink-0 whitespace-nowrap">Смотреть →</div>
    </button>
  );
}

function CountersGrid({ onOpen }: { onOpen: (k: CounterKey) => void }) {
  return (
    <div className="space-y-2.5">
      <MainRiskCard />
      <div className="grid grid-cols-2 gap-2">
        {sourceItems.map(it => <SourceTile key={it.key} item={it} onOpen={onOpen} />)}
      </div>
      <ManagersAttentionRow onOpen={onOpen} />
    </div>
  );
}

function CounterDetails({ k, onClose }: { k: CounterKey; onClose: () => void }) {
  const titleMap: Record<CounterKey, string> = {
    flags: "Критичные сигналы",
    problemClients: "Проблемные клиенты",
    overdueClients: "Клиенты с просрочкой",
    stagnantDeals: "Сделки без движения >7 дн",
    riskManagers: "Менеджеры в зоне внимания",
  };
  if (k === "flags") {
    const list = redFlags.filter(f => f.severity === "high");
    return (
      <div className="mt-3 rounded-md border border-border bg-muted/30 dark:bg-muted/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-semibold">{titleMap[k]}</div>
          <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-foreground">скрыть</button>
        </div>
        <div className="divide-y divide-border">
          {list.map((f, i) => (
            <div key={i} className="py-1.5 text-[12px]">
              <div className="font-medium leading-snug">{f.title}</div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5">
                {(f.who || f.area)}{f.amount ? ` · ${f.amount}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const list = riskCounterDetails[k as Exclude<CounterKey, "flags">];
  return (
    <div className="mt-3 rounded-md border border-border bg-muted/30 dark:bg-muted/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] font-semibold">{titleMap[k]}</div>
        <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-foreground">скрыть</button>
      </div>
      <div className="divide-y divide-border">
        {(list as any[]).map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
            <div className="min-w-0">
              <div className="font-medium truncate">{item.name}</div>
              <div className="text-[10.5px] text-muted-foreground truncate">
                {"manager" in item && item.manager}
                {"stage" in item && ` · ${item.stage}`}
                {"risk" in item && `статус: ${item.risk}`}
                {"qualityIndex" in item && ` · качество ${item.qualityIndex}/100`}
              </div>
            </div>
            <div className="text-right shrink-0 num">
              <div className="font-semibold">{item.amount || item.overdue}</div>
              {"days" in item && item.days > 0 && <div className="text-[10px] text-destructive">{item.days} дн</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Section wrapper (collapsible) ============ */
function Section({
  title, icon, summary, children, defaultOpen = false, tone = "default",
}: {
  title: string; icon: ReactNode; summary?: string; children: ReactNode;
  defaultOpen?: boolean; tone?: "default" | "danger" | "warning";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const accent = tone === "danger" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-accent";
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 active:bg-muted/40 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("shrink-0", accent)}>{icon}</span>
          <div className="min-w-0 text-left">
            <div className="text-[13px] font-semibold leading-tight">{title}</div>
            {summary && <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{summary}</div>}
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && <div className="px-3.5 pb-3.5 pt-1">{children}</div>}
    </div>
  );
}

/* ============ Sub-blocks ============ */
function StructureBlock() {
  return (
    <div>
      <div className="rounded-md border border-destructive/30 bg-destructive/[0.06] dark:bg-destructive/10 px-3 py-2.5 mb-2">
        <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Главный риск</div>
        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <div className="text-[13px] font-semibold">Кассовый разрыв</div>
          <div className="num font-display font-bold text-lg text-destructive">−{formatShort(cashGap)} ₽</div>
        </div>
      </div>
      <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground mb-1.5 px-0.5">Из чего состоит</div>
      <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
        {riskStructure.items.map((it, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 bg-card">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", sevDot(it.severity))} />
              <div className="text-[12px] truncate">{it.label}</div>
            </div>
            <div className={cn("num text-[13px] font-semibold shrink-0", sevText(it.severity))}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CausesBlock() {
  return (
    <div className="space-y-2">
      {riskCauses.map((c, i) => (
        <div key={i} className={cn("border-l-2 rounded-r-md px-3 py-2.5", sevBorder(c.severity))}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="text-[13px] font-semibold leading-snug">{c.risk}</div>
            <span className={cn("num text-[12px] font-semibold shrink-0", sevText(c.severity))}>{c.amount}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11.5px]">
            <span className="text-muted-foreground">Источник:</span><span>{c.source}</span>
            <span className="text-muted-foreground">Причина:</span><span>{c.cause}</span>
            <span className="text-muted-foreground">Владелец:</span><span className="font-medium">{c.owner}</span>
          </div>
          <div className="flex items-start gap-1.5 text-[11.5px] mt-1.5 pt-1.5 border-t border-border/60">
            <ArrowRightCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <span>{c.action}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SourcesBlock() {
  return (
    <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
      {riskSources.map((s, i) => (
        <div key={i} className="px-3 py-2.5 bg-card">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", sevDot(s.severity))} />
              <div className="text-[12.5px] font-medium truncate">{s.source}</div>
            </div>
            <div className={cn("num text-[12px] font-semibold shrink-0", sevText(s.severity))}>{s.amount}</div>
          </div>
          <div className="text-[11px] text-muted-foreground pl-3.5">{s.type}</div>
          <div className="flex items-center justify-between gap-2 pl-3.5 mt-1 text-[11px]">
            <span className="text-muted-foreground truncate">Владелец: <span className="text-foreground">{s.owner}</span></span>
            <span className="text-accent text-right shrink-0">→ {s.action}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityBlock() {
  return (
    <div className="space-y-2">
      {priorityActions.map((a, i) => (
        <div key={i} className="border border-border rounded-md bg-card px-3 py-2.5">
          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[11px] font-bold shrink-0">{i + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold leading-snug">{a.title}</div>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px] mt-1">
                <span className="text-muted-foreground">Эффект:</span><span className="text-success font-medium">{a.effect}</span>
                <span className="text-muted-foreground">Владелец:</span><span>{a.owner}</span>
                <span className="text-muted-foreground">Срок:</span><span>{a.due}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RedFlagsBlock() {
  return (
    <div className="space-y-2">
      {redFlags.map((f, i) => (
        <RedFlagItem key={i} flag={f} />
      ))}
    </div>
  );
}

function RedFlagItem({ flag }: { flag: typeof redFlags[number] }) {
  const [open, setOpen] = useState(false);
  const sev: RiskSeverity = flag.severity === "high" ? "critical" : "control";
  return (
    <div className={cn("border-l-2 rounded-r-md", sevBorder(sev))}>
      <button onClick={() => setOpen(o => !o)} className="w-full text-left px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[12.5px] font-semibold leading-snug">{flag.title}</div>
          <Badge className={cn("shrink-0 text-[10px]", sevBadge(sev))}>{sevLabel(sev)}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground mt-0.5">
          <span className="truncate">{flag.who || flag.area}</span>
          {flag.amount && <span className="num font-medium text-foreground shrink-0">{flag.amount}</span>}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-2.5 -mt-1 text-[11.5px] space-y-1 border-t border-border/60 pt-2">
          <div><span className="text-muted-foreground">Область: </span>{flag.area}</div>
          <div className="flex items-start gap-1.5">
            <ArrowRightCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <span><span className="text-muted-foreground">Действие: </span>{flag.action}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Main block ============ */
export function RiskBlock({ mobile = false }: { mobile?: boolean }) {
  const [counter, setCounter] = useState<CounterKey | null>(null);
  const highFlags = redFlags.filter(f => f.severity === "high").length;
  const riskMgrs = managers.filter(m => m.risk !== "норма").length;

  const summary = (
    <Card className={cn(!mobile && "p-0")}>
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground/80">Сводка риска</div>
      </div>
      <CountersGrid onOpen={setCounter} />
      {counter && <CounterDetails k={counter} onClose={() => setCounter(null)} />}
    </Card>
  );

  return (
    <div className="space-y-3">
      {summary}

      <Section
        defaultOpen
        title="Структура риска"
        icon={<Layers className="h-4 w-4" />}
        summary={`главный риск — кассовый разрыв −${formatShort(cashGap)} ₽`}
        tone="danger"
      >
        <StructureBlock />
      </Section>

      <Section
        defaultOpen={!mobile}
        title="Что делать первым"
        icon={<ListChecks className="h-4 w-4" />}
        summary={`${priorityActions.length} действий по приоритету влияния на деньги`}
      >
        <PriorityBlock />
      </Section>

      <Section
        title="Причины риска"
        icon={<AlertTriangle className="h-4 w-4" />}
        summary={`${riskCauses.length} ключевых рисков с владельцем и действием`}
        tone="warning"
        defaultOpen={!mobile}
      >
        <CausesBlock />
      </Section>

      <Section
        title="Кто формирует риск"
        icon={<Users className="h-4 w-4" />}
        summary={`${riskSources.length} источников · менеджеры, клиенты, сделки`}
        defaultOpen={!mobile}
      >
        <SourcesBlock />
      </Section>

      <Section
        title="Красные флаги"
        icon={<Target className="h-4 w-4" />}
        summary={`${highFlags} высоких · ${riskMgrs} менеджеров в зоне`}
        tone="danger"
        defaultOpen={!mobile}
      >
        <RedFlagsBlock />
      </Section>
    </div>
  );
}
