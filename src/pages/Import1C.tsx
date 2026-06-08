import { useState } from "react";
import { PageHeader, Card, Stat, Badge, ProgressBar } from "@/components/ui-bits";
import {
  Upload, FileDown, ShieldCheck, FileSpreadsheet, FileJson, FileText,
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight,
  Database, ArrowRight, History, Info, Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FileType = "sales" | "payments" | "receivables" | "clients" | "managers";

const fileTypes: { id: FileType; title: string; desc: string; fields: string[]; checks: string[] }[] = [
  {
    id: "sales",
    title: "Продажи",
    desc: "Документы реализации из 1С",
    fields: ["sale_id", "дата", "клиент", "инн", "договор", "менеджер", "сумма_без_ндс", "сумма_с_ндс", "себестоимость", "валовая_маржа", "маржинальность_процент", "статус_сделки", "дата_плановой_оплаты"],
    checks: ["нет sale_id", "нет клиента", "нет ИНН", "нет менеджера", "сумма ≤ 0", "себестоимость > суммы продажи", "отрицательная маржа", "нет даты плановой оплаты"],
  },
  {
    id: "payments",
    title: "Оплаты",
    desc: "Поступления денежных средств",
    fields: ["payment_id", "дата_оплаты", "клиент", "инн", "договор", "sale_id", "сумма_оплаты", "назначение_платежа"],
    checks: ["оплата без клиента", "оплата без ИНН", "оплата без sale_id", "сумма оплаты ≤ 0", "оплата не связана с продажей", "сумма оплат > суммы сделки", "дата оплаты раньше даты продажи"],
  },
  {
    id: "receivables",
    title: "Дебиторка",
    desc: "Остатки задолженности",
    fields: ["receivable_id", "клиент", "инн", "договор", "менеджер", "сумма_долга", "сумма_просрочки", "дата_возникновения", "дата_плановой_оплаты", "дней_просрочки", "статус_оплаты", "комментарий"],
    checks: ["долг без клиента", "долг без менеджера", "нет даты плановой оплаты", "просрочка есть, но дней не указано", "сумма просрочки > суммы долга", "отрицательная сумма долга", "статус не соответствует суммам"],
  },
  {
    id: "clients",
    title: "Клиенты",
    desc: "Справочник контрагентов",
    fields: ["client_id", "клиент", "инн", "статус_клиента", "лимит_дебиторки", "условия_оплаты", "отсрочка_дней", "ответственный_менеджер"],
    checks: ["нет ИНН", "дубли клиента по ИНН", "нет ответственного менеджера", "лимит < текущего долга", "клиент со статусом «стоп» имеет активные сделки"],
  },
  {
    id: "managers",
    title: "Менеджеры и планы",
    desc: "Справочник менеджеров и плановые показатели",
    fields: ["manager_id", "менеджер", "подразделение", "план_продаж", "план_оплат", "план_маржи", "активен"],
    checks: ["менеджер есть в продажах, но нет в справочнике", "план продаж не указан", "план оплат не указан", "план маржи не указан", "неактивный менеджер имеет сделки периода"],
  },
];

const lastImport = {
  date: "08.06.2026 09:30",
  source: "1С",
  format: "CSV",
  status: "warnings" as "ok" | "warnings" | "errors",
  records: 1248,
  errors: 3,
  warnings: 12,
  quality: 92,
};

const errorsList = [
  "3 сделки без менеджера",
  "2 оплаты не связаны с продажами",
  "1 клиент без ИНН",
];
const warningsList = [
  "5 сделок с отрицательной маржей",
  "4 клиента превысили лимит дебиторки",
  "7 оплат без привязки к договору",
];
const recommendations = [
  "Заполнить менеджеров в документах реализации",
  "Связать оплаты с sale_id",
  "Проверить сделки с отрицательной маржей",
  "Обновить лимиты дебиторки по клиентам",
];

const mapping = [
  { from: "Контрагент", to: "Клиент" },
  { from: "ИНН", to: "ИНН" },
  { from: "Ответственный", to: "Менеджер" },
  { from: "Сумма документа", to: "Сумма продажи" },
  { from: "Дата оплаты", to: "Дата фактической оплаты" },
  { from: "Дата платежа по договору", to: "Дата плановой оплаты" },
];

const history = [
  { date: "08.06.2026 09:30", type: "Продажи", records: 420, errors: 0, warnings: 6, status: "ok" as const, user: "А. Новиков" },
  { date: "08.06.2026 09:35", type: "Оплаты", records: 310, errors: 2, warnings: 4, status: "warnings" as const, user: "А. Новиков" },
  { date: "08.06.2026 09:40", type: "Дебиторка", records: 180, errors: 1, warnings: 2, status: "ok" as const, user: "А. Новиков" },
  { date: "07.06.2026 18:12", type: "Клиенты", records: 248, errors: 0, warnings: 0, status: "ok" as const, user: "Е. Дронова" },
  { date: "07.06.2026 18:05", type: "Менеджеры и планы", records: 14, errors: 0, warnings: 1, status: "ok" as const, user: "Е. Дронова" },
];

const downstream = [
  "продажи", "оплаты", "дебиторка", "просрочка",
  "стоимость просрочки", "менеджеры", "клиенты",
  "риски", "красные флаги", "аналитика отклонений",
];

function StatusBadge({ status }: { status: "ok" | "warnings" | "errors" }) {
  if (status === "ok") return <Badge className="bg-success/15 text-success border-success/30"><CheckCircle2 className="h-3 w-3" /> Успешно</Badge>;
  if (status === "warnings") return <Badge className="bg-warning/15 text-warning border-warning/30"><AlertTriangle className="h-3 w-3" /> Есть предупреждения</Badge>;
  return <Badge className="bg-destructive/15 text-destructive border-destructive/30"><XCircle className="h-3 w-3" /> Есть ошибки</Badge>;
}

export default function Import1C() {
  const [openType, setOpenType] = useState<FileType | null>("sales");
  const [showErr, setShowErr] = useState(true);
  const [showWarn, setShowWarn] = useState(false);

  return (
    <>
      <PageHeader
        back={{ to: "/", label: "Дашборд" }}
        title="Импорт из 1С"
        subtitle="Безопасная загрузка данных из 1С через выгрузку файлов · демо-режим"
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:opacity-90">
              <Upload className="h-4 w-4" /> Загрузить файл
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted">
              <FileDown className="h-4 w-4" /> Скачать шаблон
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted">
              <ShieldCheck className="h-4 w-4" /> Проверить данные
            </button>
          </div>
        }
      />

      {/* Last import summary */}
      <Card title="Последний импорт" subtitle={`${lastImport.date} · Источник: ${lastImport.source} · Формат: ${lastImport.format}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Stat label="Загружено записей" value={lastImport.records.toLocaleString("ru-RU")} hint="строк из файла" />
          <Stat label="Ошибки" value={lastImport.errors} tone={lastImport.errors > 0 ? "danger" : "success"} hint="требуют исправления" />
          <Stat label="Предупреждения" value={lastImport.warnings} tone="warning" hint="не блокируют импорт" />
          <Stat label="Качество данных" value={`${lastImport.quality}%`} tone={lastImport.quality >= 95 ? "success" : "warning"} hint="доля корректных записей" />
        </div>
        <div className="flex items-center gap-2"><StatusBadge status={lastImport.status} /></div>
      </Card>

      {/* Supported file types */}
      <div className="mt-4">
        <Card title="Поддерживаемые типы файлов" subtitle="MVP: CSV / JSON / XLSX · реальный парсинг XLSX появится позже">
          <div className="space-y-2">
            {fileTypes.map((ft) => {
              const open = openType === ft.id;
              return (
                <div key={ft.id} className="border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => setOpenType(open ? null : ft.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{ft.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{ft.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="border-border text-muted-foreground"><FileText className="h-3 w-3" />CSV</Badge>
                      <Badge className="border-border text-muted-foreground hidden sm:inline-flex"><FileJson className="h-3 w-3" />JSON</Badge>
                      <Badge className="border-border text-muted-foreground hidden sm:inline-flex"><FileSpreadsheet className="h-3 w-3" />XLSX</Badge>
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                  {open && (
                    <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/20 grid sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground mb-1.5">Поля шаблона</div>
                        <div className="flex flex-wrap gap-1">
                          {ft.fields.map((f) => (
                            <span key={f} className="text-[11px] px-1.5 py-0.5 rounded bg-card border border-border font-mono">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground mb-1.5">Проверки качества</div>
                        <ul className="space-y-1">
                          {ft.checks.map((c) => (
                            <li key={c} className="text-[12px] flex items-start gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                        <button className="mt-2 inline-flex items-center gap-1 text-[12px] text-accent hover:underline">
                          <FileDown className="h-3.5 w-3.5" /> Скачать шаблон «{ft.title}»
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Quality */}
      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Качество данных" subtitle="Сводка по последнему импорту">
          <div className="flex items-center gap-3 mb-3">
            <div className="num font-display text-3xl font-semibold">{lastImport.quality}%</div>
            <div className="flex-1"><ProgressBar value={lastImport.quality} tone={lastImport.quality >= 95 ? "success" : "warning"} /></div>
          </div>
          <div className="space-y-2">
            <button onClick={() => setShowErr(!showErr)} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-destructive/30 bg-destructive/5 hover:bg-destructive/10">
              <span className="flex items-center gap-2 text-sm font-medium text-destructive"><XCircle className="h-4 w-4" /> Ошибки · {errorsList.length}</span>
              {showErr ? <ChevronDown className="h-4 w-4 text-destructive" /> : <ChevronRight className="h-4 w-4 text-destructive" />}
            </button>
            {showErr && (
              <ul className="pl-4 space-y-1">
                {errorsList.map((e) => <li key={e} className="text-[13px] text-foreground/90 list-disc">{e}</li>)}
              </ul>
            )}
            <button onClick={() => setShowWarn(!showWarn)} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-warning/30 bg-warning/5 hover:bg-warning/10">
              <span className="flex items-center gap-2 text-sm font-medium text-warning"><AlertTriangle className="h-4 w-4" /> Предупреждения · {warningsList.length}</span>
              {showWarn ? <ChevronDown className="h-4 w-4 text-warning" /> : <ChevronRight className="h-4 w-4 text-warning" />}
            </button>
            {showWarn && (
              <ul className="pl-4 space-y-1">
                {warningsList.map((w) => <li key={w} className="text-[13px] text-foreground/90 list-disc">{w}</li>)}
              </ul>
            )}
          </div>
        </Card>
        <Card title="Рекомендации" subtitle="Как поднять качество">
          <ul className="space-y-2">
            {recommendations.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px]">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Field mapping */}
      <div className="mt-4">
        <Card title="Сопоставление полей" subtitle="Поля из файла 1С → поля приложения">
          <div className="space-y-1.5">
            {mapping.map((m) => (
              <div key={m.from} className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/20">
                <div className="text-[13px] font-mono truncate">{m.from}</div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="text-[13px] font-medium truncate">{m.to}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>В MVP сопоставление полей показано как демо-схема. Drag-and-drop появится в следующей версии.</span>
          </div>
        </Card>
      </div>

      {/* History */}
      <div className="mt-4">
        <Card title="История импортов" subtitle="Последние загрузки">
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-md border border-border bg-card">
                <div className="flex items-center gap-2 sm:w-44 shrink-0">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground num">{h.date}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{h.type}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {h.records} записей · {h.errors} ошибок · {h.warnings} предупреждений · {h.user}
                  </div>
                </div>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Downstream effect */}
      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        <Card title="Что обновляется после импорта" subtitle="Дашборд обновляется только после успешной проверки">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {downstream.map((d) => (
              <span key={d} className="text-[12px] px-2 py-1 rounded-md bg-muted border border-border">{d}</span>
            ))}
          </div>
          <div className="text-[12px] text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Записи с критичными ошибками не попадают в расчёты. Сначала их нужно исправить в 1С и загрузить повторно.</span>
          </div>
        </Card>

        {/* Security */}
        <Card title="Безопасная схема подключения 1С" subtitle="Почему через файлы, а не напрямую">
          <p className="text-[13px] text-foreground/85 mb-3">
            На первом этапе приложение не подключается к 1С напрямую. Данные загружаются через контролируемую выгрузку файлов.
            Это снижает риски для учетной базы и позволяет проверить качество данных до обновления дашборда.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12px] mb-3">
            {["1С", "Выгрузка CSV / JSON / XLSX", "Проверка данных", "Импорт", "Дашборд"].map((s, i, arr) => (
              <div key={s} className="flex items-center gap-2">
                <span className={cn("px-2 py-1 rounded-md border", i === 0 ? "bg-accent/10 border-accent/30 text-accent" : i === arr.length - 1 ? "bg-success/10 border-success/30 text-success" : "bg-card border-border")}>
                  {s}
                </span>
                {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-[12px] text-foreground/90 flex items-start gap-1.5">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span>Не рекомендуется подключать веб-приложение напрямую к базе 1С. Для промышленной интеграции лучше использовать промежуточный backend или регламентную выгрузку.</span>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground flex items-start gap-1.5">
            <Database className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Текущий статус: демо-режим на примере данных. Реальная обработка XLSX появится после согласования формата выгрузки с вашим 1С-специалистом.</span>
          </div>
        </Card>
      </div>
    </>
  );
}
