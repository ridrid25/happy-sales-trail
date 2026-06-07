import { useMemo, useState } from "react";
import { deals, managers, formatShort, paymentStatusColor } from "@/data/demo";
import { Card, PageHeader, Badge } from "@/components/ui-bits";
import { Filter } from "lucide-react";

const stages = ["all", "Новый лид", "Контакт установлен", "Потребность выявлена", "КП отправлено", "Переговоры", "Счёт выставлен", "Выиграна", "Потеряна"];
const statuses = ["all", "оплачено", "частично", "ожидает", "просрочено", "проблемная"];

export default function Deals() {
  const [manager, setManager] = useState("all");
  const [stage, setStage] = useState("all");
  const [status, setStatus] = useState("all");
  const [lowMargin, setLowMargin] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => deals.filter(d =>
    (manager === "all" || d.manager === manager) &&
    (stage === "all" || d.stage === stage) &&
    (status === "all" || d.paymentStatus === status) &&
    (!lowMargin || d.marginPct < 15) &&
    (!overdueOnly || d.overdueDays > 0) &&
    (search === "" || d.client.toLowerCase().includes(search.toLowerCase()))
  ), [manager, stage, status, lowMargin, overdueOnly, search]);

  return (
    <>
      <PageHeader back={{ to: "/", label: "Дашборд" }} title="Сделки" subtitle={`Всего: ${filtered.length} из ${deals.length}`} />

      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" /> Фильтры
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
          <input
            type="text" placeholder="Поиск по клиенту"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-card lg:col-span-2"
          />
          <Select value={manager} onChange={setManager} options={[["all","Все менеджеры"], ...managers.map(m => [m.name, m.name] as [string, string])]} />
          <Select value={stage} onChange={setStage} options={stages.map(s => [s, s === "all" ? "Все этапы" : s])} />
          <Select value={status} onChange={setStatus} options={statuses.map(s => [s, s === "all" ? "Все статусы" : s])} />
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={lowMargin} onChange={(e) => setLowMargin(e.target.checked)} />
              <span>Низкая маржа</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
              <span>Просрочка</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Cards mobile */}
      <div className="grid gap-3 lg:hidden">
        {filtered.map((d) => (
          <div key={d.id} className="bg-card border border-border rounded-lg p-3 shadow-card">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <div className="font-medium text-sm">{d.client}</div>
                <div className="text-[11px] text-muted-foreground">{d.manager} · {d.stage}</div>
              </div>
              <Badge className={paymentStatusColor[d.paymentStatus]}>{d.paymentStatus}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <Mini label="Сумма" value={`${formatShort(d.amount)} ₽`} />
              <Mini label="Маржа" value={`${d.marginPct}%`} danger={d.marginPct < 15} />
              <Mini label="Оплачено" value={`${formatShort(d.paid)} ₽`} />
              <Mini label="Не оплачено" value={`${formatShort(d.unpaid)} ₽`} />
              <Mini label="План оплаты" value={d.planPayDate} />
              <Mini label="Просрочка" value={d.overdueDays > 0 ? `${d.overdueDays} дн` : "—"} danger={d.overdueDays > 0} />
            </div>
            {d.comment && <div className="mt-2 text-[11px] text-muted-foreground border-t border-border pt-2">{d.comment}</div>}
          </div>
        ))}
      </div>

      <Card className="hidden lg:block">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <Th>Клиент</Th><Th>Менеджер</Th>
                <Th right>Сумма</Th><Th right>Себест.</Th><Th right>Маржа ₽</Th><Th right>Маржа %</Th>
                <Th>Этап</Th><Th right>Продажа</Th><Th right>План опл.</Th><Th right>Факт опл.</Th>
                <Th right>Оплачено</Th><Th right>Не опл.</Th><Th right>Просрочка</Th>
                <Th right>Статус</Th><Th>Условия</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-2 font-medium">{d.client}</td>
                  <td className="py-2.5 px-2 text-muted-foreground text-[13px]">{d.manager}</td>
                  <td className="py-2.5 px-2 text-right num">{formatShort(d.amount)}</td>
                  <td className="py-2.5 px-2 text-right num text-muted-foreground">{formatShort(d.cost)}</td>
                  <td className="py-2.5 px-2 text-right num">{formatShort(d.margin)}</td>
                  <td className={`py-2.5 px-2 text-right num ${d.marginPct < 15 && d.stage === "Выиграна" ? "text-destructive font-semibold" : ""}`}>{d.marginPct}%</td>
                  <td className="py-2.5 px-2 text-[13px] text-muted-foreground">{d.stage}</td>
                  <td className="py-2.5 px-2 text-right text-[13px]">{d.saleDate}</td>
                  <td className="py-2.5 px-2 text-right text-[13px]">{d.planPayDate}</td>
                  <td className="py-2.5 px-2 text-right text-[13px]">{d.factPayDate ?? "—"}</td>
                  <td className="py-2.5 px-2 text-right num text-success">{formatShort(d.paid)}</td>
                  <td className="py-2.5 px-2 text-right num">{formatShort(d.unpaid)}</td>
                  <td className={`py-2.5 px-2 text-right num ${d.overdueDays > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{d.overdueDays > 0 ? `${d.overdueDays} дн` : "—"}</td>
                  <td className="py-2.5 px-2 text-right"><Badge className={paymentStatusColor[d.paymentStatus]}>{d.paymentStatus}</Badge></td>
                  <td className="py-2.5 px-2 text-[12px] text-muted-foreground">{d.paymentTerms}</td>
                </tr>
              ))}
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
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="text-sm border border-border rounded-md px-3 py-1.5 bg-card">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
function Mini({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className={`num font-semibold text-[13px] ${danger ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
