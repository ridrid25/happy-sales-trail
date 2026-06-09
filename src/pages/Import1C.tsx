import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Card, Stat, Badge, ProgressBar } from "@/components/ui-bits";
import {
  Upload, FileDown, ShieldCheck, FileSpreadsheet, FileJson, FileText,
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight,
  Database, ArrowRight, History, Info, Sparkles, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ALL_FIELDS, REQUIRED_FIELDS, buildTemplateCSV, parseFile,
  validateRecords, revalidate, summarize, type ParseResult, type Issue, type ReceivableRow,
} from "@/lib/receivablesImport";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    desc: "Остатки задолженности · рабочая загрузка CSV/JSON",
    fields: [...ALL_FIELDS],
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

// Demo defaults — shown until user applies their own file
const demoLastImport = {
  date: "08.06.2026 09:30",
  source: "1С",
  format: "CSV",
  status: "warnings" as "ok" | "warnings" | "errors",
  records: 1248,
  errors: 3,
  warnings: 12,
  quality: 92,
};
const demoErrors = ["3 сделки без менеджера", "2 оплаты не связаны с продажами", "1 клиент без ИНН"];
const demoWarnings = ["5 сделок с отрицательной маржей", "4 клиента превысили лимит дебиторки", "7 оплат без привязки к договору"];

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

type HistoryStatus = "ok" | "warnings" | "errors";
type HistoryItem = { date: string; type: string; records: number; errors: number; warnings: number; status: HistoryStatus; user: string; fileName: string };
const initialHistory: HistoryItem[] = [
  { date: "08.06.2026 09:30", type: "Продажи", records: 420, errors: 0, warnings: 6, status: "ok", user: "А. Новиков", fileName: "—" },
  { date: "08.06.2026 09:35", type: "Оплаты", records: 310, errors: 2, warnings: 4, status: "warnings", user: "А. Новиков", fileName: "—" },
  { date: "07.06.2026 18:12", type: "Клиенты", records: 248, errors: 0, warnings: 0, status: "ok", user: "Е. Дронова", fileName: "—" },
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

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function fmtMoney(v: number) { return v.toLocaleString("ru-RU") + " ₽"; }
function fmtShort(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2).replace(".", ",") + " млн ₽";
  if (v >= 1_000) return Math.round(v / 1_000) + " тыс ₽";
  return v + " ₽";
}
function nowStamp() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type AppliedSummary = {
  fileName: string;
  format: "CSV" | "JSON";
  date: string;
  records: number;
  errors: number;
  warnings: number;
  quality: number;
  totalDebt: number;
  totalOverdue: number;
  totalCost: number;
  avgDays: number;
  overduePct: number;
  clientsOverdue: number;
};

export default function Import1C() {
  const [openType, setOpenType] = useState<FileType | null>("receivables");
  const [showErr, setShowErr] = useState(true);
  const [showWarn, setShowWarn] = useState(false);

  // Receivables import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; format: "CSV" | "JSON" } | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [previewErrOpen, setPreviewErrOpen] = useState(true);
  const [previewWarnOpen, setPreviewWarnOpen] = useState(false);
  const [applied, setApplied] = useState<AppliedSummary | null>(null);
  const [history, setHistory] = useState(initialHistory);

  // Inline-fix state (session-only)
  const [fixedRows, setFixedRows] = useState<Set<number>>(new Set());
  const [fixLog, setFixLog] = useState<{ row: number; fields: string[] }[]>([]);
  const [editing, setEditing] = useState<{ rowNum: number; focusField?: string } | null>(null);
  const editingRow = useMemo(
    () => (editing && result ? result.rows.find((x) => x.rowNum === editing.rowNum) ?? null : null),
    [editing, result],
  );

  const summary = useMemo(() => (result ? summarize(result) : null), [result]);
  const quality = useMemo(() => {
    if (!result || result.rows.length === 0) return 0;
    const bad = new Set(result.errors.map((e) => e.row)).size;
    return Math.max(0, Math.round((1 - bad / result.rows.length) * 100));
  }, [result]);

  const lastImport = applied ?? demoLastImport;
  const lastStatus: "ok" | "warnings" | "errors" = applied
    ? (applied.errors > 0 ? "errors" : applied.warnings > 0 ? "warnings" : "ok")
    : demoLastImport.status;
  const lastErrorsList = applied ? [] : demoErrors;
  const lastWarningsList = applied ? [] : demoWarnings;

  async function onFileChosen(file: File) {
    setParseError(null);
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".json")) {
      setParseError("Сейчас поддерживаются CSV и JSON. XLSX будет добавлен позже.");
      setFileInfo(null); setResult(null);
      return;
    }
    try {
      const { records, format } = await parseFile(file);
      const validated = validateRecords(records);
      setFileInfo({ name: file.name, format });
      setResult(validated);
      setFixedRows(new Set());
      setFixLog([]);
      setPreviewErrOpen(true);
      setPreviewWarnOpen(false);
    } catch (e) {
      setParseError("Не удалось прочитать файл. Проверьте, что это валидный CSV или JSON.");
      setFileInfo(null); setResult(null);
      console.error(e);
    }
  }

  function openEditor(rowNum: number, focusField?: string) {
    if (!result) return;
    const r = result.rows.find((x) => x.rowNum === rowNum);
    if (r) setEditing({ rowNum, focusField });
  }

  function saveEditedRow(edited: ReceivableRow) {
    if (!result) return;
    const before = result.rows.find((x) => x.rowNum === edited.rowNum);
    const changed: string[] = [];
    if (before) {
      (Object.keys(edited) as (keyof ReceivableRow)[]).forEach((k) => {
        if (k === "rowNum" || k === "стоимость_просрочки") return;
        if (String(before[k] ?? "") !== String(edited[k] ?? "")) changed.push(String(k));
      });
    }
    const nextRows = result.rows.map((r) => (r.rowNum === edited.rowNum ? edited : r));
    const next = revalidate(nextRows);
    setResult(next);
    setFixedRows((s) => new Set(s).add(edited.rowNum));
    setFixLog((log) => {
      const without = log.filter((e) => e.row !== edited.rowNum);
      return [{ row: edited.rowNum, fields: changed }, ...without];
    });
    const remaining = next.errors.filter((e) => e.row === edited.rowNum).length;
    if (remaining === 0) setEditing(null);
    else setEditing({ rowNum: edited.rowNum });
  }


  function handleApply() {
    if (!result || !fileInfo || !summary) return;
    if (result.errors.length > 0) return;
    const errRows = new Set(result.errors.map((e) => e.row)).size;
    const warnRows = new Set(result.warnings.map((w) => w.row)).size;
    const a: AppliedSummary = {
      fileName: fileInfo.name,
      format: fileInfo.format,
      date: nowStamp(),
      records: result.rows.length,
      errors: errRows,
      warnings: warnRows,
      quality,
      ...summary,
    };
    setApplied(a);
    setHistory((h) => [{
      date: a.date,
      type: "Дебиторка",
      records: a.records,
      errors: a.errors,
      warnings: a.warnings,
      status: a.errors > 0 ? "errors" : a.warnings > 0 ? "warnings" : "ok",
      user: "вы",
      fileName: a.fileName,
    }, ...h]);
  }

  function handleDownloadTemplate() {
    downloadFile("debtors_template.csv", buildTemplateCSV(), "text/csv");
  }

  return (
    <>
      <PageHeader
        back={{ to: "/", label: "Дашборд" }}
        title="Импорт из 1С"
        subtitle="Ручной импорт из выгрузки 1С · файл обрабатывается локально в браузере · прямого подключения к базе 1С нет"
        actions={
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:opacity-90"
              >
                <Upload className="h-4 w-4" /> Загрузить файл дебиторки
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted"
              >
                <FileDown className="h-4 w-4" /> Скачать шаблон дебиторки
              </button>
            </div>
            <div className="text-[11px] text-muted-foreground">Шаблон сохранён в UTF-8 и корректно открывается в Excel.</div>
          </div>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.xlsx,application/json,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChosen(f);
          e.target.value = "";
        }}
      />

      {parseError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive flex items-start gap-2">
          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Last import summary */}
      <Card
        title="Последний импорт"
        subtitle={
          applied
            ? `${applied.date} · Источник: файл · Формат: ${applied.format} · ${applied.fileName}`
            : `${demoLastImport.date} · Источник: ${demoLastImport.source} · Формат: ${demoLastImport.format} · демо-данные`
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Stat label="Загружено записей" value={lastImport.records.toLocaleString("ru-RU")} hint="строк из файла" />
          <Stat label="Ошибки" value={lastImport.errors} tone={lastImport.errors > 0 ? "danger" : "success"} hint="требуют исправления" />
          <Stat label="Предупреждения" value={lastImport.warnings} tone="warning" hint="не блокируют импорт" />
          <Stat label="Качество данных" value={`${lastImport.quality}%`} tone={lastImport.quality >= 95 ? "success" : "warning"} hint="доля корректных записей" />
        </div>
        <div className="flex items-center gap-2 mb-3"><StatusBadge status={lastStatus} /></div>

        {applied && (
          <>
            <div className="text-[11px] uppercase text-muted-foreground mb-2">Показатели по применённой дебиторке</div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <Stat label="Общая дебиторка" value={fmtShort(applied.totalDebt)} hint="из загруженного файла" />
              <Stat label="Просроченная дебиторка" value={fmtShort(applied.totalOverdue)} tone={applied.totalOverdue > 0 ? "warning" : "success"} hint={`${applied.overduePct}% от долга`} />
              <Stat label="Стоимость просрочки" value={fmtShort(applied.totalCost)} tone="danger" hint="24% годовых × дней / 365" />
              <Stat label="Средний срок просрочки" value={`${applied.avgDays} дн`} tone={applied.avgDays > 30 ? "danger" : "warning"} hint="по строкам с просрочкой" />
              <Stat label="Клиенты с просрочкой" value={applied.clientsOverdue} hint="уникальные ИНН/клиенты" />
              <Stat label="Статус импорта" value={applied.errors > 0 ? "ошибки" : applied.warnings > 0 ? "с предупреждениями" : "применено"} tone={applied.errors > 0 ? "danger" : applied.warnings > 0 ? "warning" : "success"} />
            </div>
            <div className="mt-3 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-[12px] text-foreground/90 flex items-start gap-1.5">
              <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <span>Данные дебиторки применены в демо-режиме. Полный пересчёт всех разделов будет добавлен на следующем этапе.</span>
            </div>
          </>
        )}
      </Card>

      {/* Preview block — only when a file has been parsed */}
      {result && fileInfo && summary && (
        <div className="mt-4">
          <Card
            title="Предпросмотр файла"
            subtitle={`${fileInfo.name} · ${fileInfo.format} · обработано локально в браузере`}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <Stat label="Строк в файле" value={result.rows.length} />
              <Stat label="Корректных строк" value={result.rows.length - new Set(result.errors.map((e) => e.row)).size} tone="success" />
              <Stat label="Ошибок" value={result.errors.length} tone={result.errors.length > 0 ? "danger" : "success"} />
              <Stat label="Предупреждений" value={result.warnings.length} tone={result.warnings.length > 0 ? "warning" : "success"} />
            </div>

            <div className="mb-3 flex items-center gap-3">
              <div className="num font-display text-2xl font-semibold">{quality}%</div>
              <div className="flex-1"><ProgressBar value={quality} tone={quality >= 95 ? "success" : quality >= 70 ? "warning" : "danger"} /></div>
              <div className="text-[11px] text-muted-foreground">качество</div>
            </div>

            <div className="mb-2 text-[11px] uppercase text-muted-foreground">Первые 5 строк</div>
            <RowsPreview rows={result.rows.slice(0, 5)} fixedRows={fixedRows} />

            {fixedRows.size > 0 && (
              <div className="mt-3 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-[12px]">
                <div className="font-medium text-success mb-1 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5" /> Исправлено строк: {fixedRows.size}
                </div>
                <ul className="space-y-0.5 text-foreground/85">
                  {fixLog.slice(0, 6).map((e) => (
                    <li key={e.row}>
                      Строка {e.row}: {e.fields.length ? `поля ${e.fields.join(", ")} исправлены пользователем` : "строка отредактирована пользователем"}.
                    </li>
                  ))}
                </ul>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Исправления применяются только к импортируемому файлу в этом приложении. Данные в 1С не изменяются.
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <button onClick={() => setPreviewErrOpen(!previewErrOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-destructive/30 bg-destructive/5 hover:bg-destructive/10">
                <span className="flex items-center gap-2 text-sm font-medium text-destructive"><XCircle className="h-4 w-4" /> Критичные ошибки · {result.errors.length}</span>
                {previewErrOpen ? <ChevronDown className="h-4 w-4 text-destructive" /> : <ChevronRight className="h-4 w-4 text-destructive" />}
              </button>
              {previewErrOpen && <IssueList items={result.errors} tone="destructive" empty="Критичных ошибок нет." onFix={openEditor} />}

              <button onClick={() => setPreviewWarnOpen(!previewWarnOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-warning/30 bg-warning/5 hover:bg-warning/10">
                <span className="flex items-center gap-2 text-sm font-medium text-warning"><AlertTriangle className="h-4 w-4" /> Предупреждения · {result.warnings.length}</span>
                {previewWarnOpen ? <ChevronDown className="h-4 w-4 text-warning" /> : <ChevronRight className="h-4 w-4 text-warning" />}
              </button>
              {previewWarnOpen && <IssueList items={result.warnings} tone="warning" empty="Предупреждений нет." onFix={openEditor} />}
            </div>

            <div className="mt-3 text-[11px] text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Исправления доступны только до обновления страницы. Для постоянного исправления внесите изменения в исходную выгрузку 1С.</span>
            </div>


            <div className="mt-4 grid sm:grid-cols-2 gap-3 items-center">
              <div className="text-[12px] text-muted-foreground">
                Итоговая стоимость просрочки по файлу: <span className="num font-medium text-foreground">{fmtMoney(summary.totalCost)}</span>
              </div>
              <div className="flex sm:justify-end gap-2 flex-wrap">
                <button
                  disabled={result.errors.length > 0}
                  onClick={handleApply}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium",
                    result.errors.length > 0
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-accent text-accent-foreground hover:opacity-90"
                  )}
                  title={result.errors.length > 0 ? "Сначала исправьте критичные ошибки" : "Применить данные к дашборду"}
                >
                  <Sparkles className="h-4 w-4" /> Применить данные к дашборду
                </button>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-2 text-[12px] text-destructive">
                Применить нельзя: есть критичные ошибки. Исправьте файл и загрузите снова.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Supported file types */}
      <div className="mt-4">
        <Card title="Поддерживаемые типы файлов" subtitle="MVP: реально работает только «Дебиторка» (CSV/JSON). Остальные — демо-шаблоны.">
          <div className="space-y-2">
            {fileTypes.map((ft) => {
              const open = openType === ft.id;
              const isReceivables = ft.id === "receivables";
              return (
                <div key={ft.id} className={cn("border rounded-md overflow-hidden", isReceivables ? "border-accent/40" : "border-border")}>
                  <button
                    onClick={() => setOpenType(open ? null : ft.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          {ft.title}
                          {isReceivables && <Badge className="bg-accent/15 text-accent border-accent/30">рабочий</Badge>}
                          {!isReceivables && <Badge className="border-border text-muted-foreground">демо</Badge>}
                        </div>
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
                          {ft.fields.map((f) => {
                            const req = isReceivables && (REQUIRED_FIELDS as readonly string[]).includes(f);
                            return (
                              <span key={f} className={cn(
                                "text-[11px] px-1.5 py-0.5 rounded border font-mono",
                                req ? "bg-accent/10 border-accent/30 text-accent" : "bg-card border-border"
                              )}>
                                {f}{req ? " *" : ""}
                              </span>
                            );
                          })}
                        </div>
                        {isReceivables && <div className="mt-2 text-[10px] text-muted-foreground">* — обязательное поле</div>}
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
                        {isReceivables ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-md bg-accent text-accent-foreground hover:opacity-90"
                            >
                              <Upload className="h-3.5 w-3.5" /> Загрузить файл
                            </button>
                            <button
                              onClick={handleDownloadTemplate}
                              className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-md border border-border hover:bg-muted"
                            >
                              <FileDown className="h-3.5 w-3.5" /> Скачать шаблон
                            </button>
                          </div>
                        ) : (
                          <button className="mt-2 inline-flex items-center gap-1 text-[12px] text-muted-foreground cursor-not-allowed">
                            <FileDown className="h-3.5 w-3.5" /> Шаблон появится позже
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Quality (legacy summary, hidden when user applied own data) */}
      {!applied && (
        <div className="mt-4 grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2" title="Качество данных" subtitle="Сводка по последнему демо-импорту">
            <div className="flex items-center gap-3 mb-3">
              <div className="num font-display text-3xl font-semibold">{demoLastImport.quality}%</div>
              <div className="flex-1"><ProgressBar value={demoLastImport.quality} tone={demoLastImport.quality >= 95 ? "success" : "warning"} /></div>
            </div>
            <div className="space-y-2">
              <button onClick={() => setShowErr(!showErr)} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-destructive/30 bg-destructive/5 hover:bg-destructive/10">
                <span className="flex items-center gap-2 text-sm font-medium text-destructive"><XCircle className="h-4 w-4" /> Ошибки · {lastErrorsList.length}</span>
                {showErr ? <ChevronDown className="h-4 w-4 text-destructive" /> : <ChevronRight className="h-4 w-4 text-destructive" />}
              </button>
              {showErr && (
                <ul className="pl-4 space-y-1">
                  {lastErrorsList.map((e) => <li key={e} className="text-[13px] text-foreground/90 list-disc">{e}</li>)}
                </ul>
              )}
              <button onClick={() => setShowWarn(!showWarn)} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-warning/30 bg-warning/5 hover:bg-warning/10">
                <span className="flex items-center gap-2 text-sm font-medium text-warning"><AlertTriangle className="h-4 w-4" /> Предупреждения · {lastWarningsList.length}</span>
                {showWarn ? <ChevronDown className="h-4 w-4 text-warning" /> : <ChevronRight className="h-4 w-4 text-warning" />}
              </button>
              {showWarn && (
                <ul className="pl-4 space-y-1">
                  {lastWarningsList.map((w) => <li key={w} className="text-[13px] text-foreground/90 list-disc">{w}</li>)}
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
      )}

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
        <Card title="История импортов" subtitle="Сессионная история — не сохраняется между перезагрузками страницы">
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-md border border-border bg-card">
                <div className="flex items-center gap-2 sm:w-44 shrink-0">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground num">{h.date}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{h.type}{h.fileName && h.fileName !== "—" ? ` · ${h.fileName}` : ""}</div>
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
        <Card title="Что обновляется после импорта" subtitle="В MVP пересчёт показан в блоке «Последний импорт». Полный пересчёт всех разделов — на следующем этапе.">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {downstream.map((d) => (
              <span key={d} className="text-[12px] px-2 py-1 rounded-md bg-muted border border-border">{d}</span>
            ))}
          </div>
          <div className="text-[12px] text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Записи с критичными ошибками не попадают в расчёты. Сначала их нужно исправить и загрузить файл повторно.</span>
          </div>
        </Card>

        {/* Security */}
        <Card title="Безопасная схема подключения 1С" subtitle="Почему через файлы, а не напрямую">
          <p className="text-[13px] text-foreground/85 mb-3">
            Приложение не подключается к 1С напрямую. Данные загружаются через контролируемую выгрузку файлов и обрабатываются локально в браузере.
            Это снижает риски для учётной базы и позволяет проверить качество данных до обновления показателей.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12px] mb-3">
            {["1С", "Выгрузка CSV / JSON", "Проверка в браузере", "Применение", "Дашборд"].map((s, i, arr) => (
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
            <span>Файл обрабатывается локально в интерфейсе приложения. Прямого подключения к базе 1С нет.</span>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground flex items-start gap-1.5">
            <Database className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Текущий статус: рабочий импорт дебиторки (CSV/JSON). Остальные типы файлов — демо-шаблоны.</span>
          </div>
        </Card>
      </div>

      <EditRowDialog
        row={editingRow}
        focusField={editing?.focusField}
        errors={result?.errors.filter((e) => editingRow && e.row === editingRow.rowNum) ?? []}
        warnings={result?.warnings.filter((w) => editingRow && w.row === editingRow.rowNum) ?? []}
        onCancel={() => setEditing(null)}
        onSave={saveEditedRow}
      />
    </>
  );
}

// ====== Sub-components ======

function RowsPreview({ rows, fixedRows }: { rows: ReceivableRow[]; fixedRows: Set<number> }) {
  if (rows.length === 0) {
    return <div className="text-[12px] text-muted-foreground px-3 py-4 rounded-md border border-dashed border-border">В файле нет строк данных.</div>;
  }
  const fixedBadge = (
    <Badge className="bg-success/15 text-success border-success/30"><Wrench className="h-3 w-3" /> исправлено</Badge>
  );
  return (
    <>
      {/* Mobile: compact cards */}
      <div className="space-y-2 md:hidden">
        {rows.map((r) => (
          <div key={`${r.rowNum}-${r.receivable_id}`} className="rounded-md border border-border bg-card px-3 py-2 text-[12px]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="font-medium truncate">{r.клиент || <span className="text-muted-foreground">— клиент —</span>}</div>
              <div className="flex items-center gap-1.5 shrink-0">
                {fixedRows.has(r.rowNum) && fixedBadge}
                <Badge className="border-border text-muted-foreground">#{r.rowNum}</Badge>
              </div>
            </div>
            <div className="text-muted-foreground">{r.менеджер || "— менеджер —"} · ИНН {r.инн || "—"}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
              <div>Долг: <span className="num font-medium text-foreground">{fmtShort(r.сумма_долга)}</span></div>
              <div>Просрочка: <span className="num font-medium text-foreground">{fmtShort(r.сумма_просрочки)}</span></div>
              <div>Дней: <span className="num font-medium text-foreground">{r.дней_просрочки}</span></div>
              <div>Стоимость: <span className="num font-medium text-foreground">{fmtShort(r.стоимость_просрочки)}</span></div>
            </div>
            <div className="text-muted-foreground mt-1">Статус: {r.статус_оплаты || "—"}</div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-md border border-border">
        <table className="w-full text-[12px]">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-2 py-1.5">#</th>
              <th className="text-left px-2 py-1.5">Клиент</th>
              <th className="text-left px-2 py-1.5">Менеджер</th>
              <th className="text-right px-2 py-1.5">Долг</th>
              <th className="text-right px-2 py-1.5">Просрочка</th>
              <th className="text-right px-2 py-1.5">Дней</th>
              <th className="text-right px-2 py-1.5">Стоимость</th>
              <th className="text-left px-2 py-1.5">Статус</th>
              <th className="text-left px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.rowNum}-${r.receivable_id}`} className={cn("border-t border-border", fixedRows.has(r.rowNum) && "bg-success/5")}>
                <td className="px-2 py-1.5 text-muted-foreground">{r.rowNum}</td>
                <td className="px-2 py-1.5 truncate max-w-[180px]">{r.клиент || "—"}</td>
                <td className="px-2 py-1.5 truncate max-w-[150px]">{r.менеджер || "—"}</td>
                <td className="px-2 py-1.5 text-right num">{fmtShort(r.сумма_долга)}</td>
                <td className="px-2 py-1.5 text-right num">{fmtShort(r.сумма_просрочки)}</td>
                <td className="px-2 py-1.5 text-right num">{r.дней_просрочки}</td>
                <td className="px-2 py-1.5 text-right num">{fmtShort(r.стоимость_просрочки)}</td>
                <td className="px-2 py-1.5">{r.статус_оплаты || "—"}</td>
                <td className="px-2 py-1.5">{fixedRows.has(r.rowNum) && fixedBadge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function IssueList({ items, tone, empty, onFix }: { items: Issue[]; tone: "destructive" | "warning"; empty: string; onFix?: (rowNum: number, field: string) => void }) {
  if (items.length === 0) {
    return <div className="text-[12px] text-muted-foreground px-3 py-2">{empty}</div>;
  }
  const border = tone === "destructive" ? "border-destructive/20" : "border-warning/20";
  const accent = tone === "destructive" ? "text-destructive" : "text-warning";
  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {items.map((it, i) => (
        <div key={i} className={cn("rounded-md border bg-card px-3 py-2 text-[12px]", border)}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className={cn("font-medium", accent)}>Строка {it.row}</div>
            <Badge className="border-border text-muted-foreground font-mono">{it.field}</Badge>
          </div>
          <div className="mt-1 text-foreground/90">Проблема: {it.problem}</div>
          <div className="text-muted-foreground">Рекомендация: {it.hint}</div>
          {onFix && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => onFix(it.row, it.field)}
                className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-md border border-border bg-card hover:bg-muted"
              >
                <Wrench className="h-3.5 w-3.5" /> Исправить
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const STATUS_OPTIONS = ["оплачено", "частично", "ожидает", "просрочено", "проблемная"] as const;

// dd.mm.yyyy <-> yyyy-mm-dd for native <input type="date">
function toIsoDate(s: string): string {
  if (!s) return "";
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m2 ? s : "";
}
function fromIsoDate(s: string): string {
  if (!s) return "";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : s;
}

const FIELD_LABELS: Record<string, string> = {
  receivable_id: "ID дебиторки",
  клиент: "Клиент",
  инн: "ИНН",
  договор: "Договор",
  менеджер: "Менеджер",
  сумма_долга: "Сумма долга",
  сумма_просрочки: "Сумма просрочки",
  дата_возникновения: "Дата возникновения",
  дата_плановой_оплаты: "Дата плановой оплаты",
  дней_просрочки: "Дней просрочки",
  статус_оплаты: "Статус оплаты",
  комментарий: "Комментарий",
};

function EditRowDialog({
  row, focusField, errors, warnings, onCancel, onSave,
}: {
  row: ReceivableRow | null;
  focusField?: string;
  errors: Issue[];
  warnings: Issue[];
  onCancel: () => void;
  onSave: (r: ReceivableRow) => void;
}) {
  const [draft, setDraft] = useState<ReceivableRow | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Sync draft when row changes
  useEffect(() => { setDraft(row ? { ...row } : null); }, [row]);

  // Maps field -> first issue (error wins over warning)
  const errByField = useMemo(() => {
    const m: Record<string, Issue> = {};
    errors.forEach((e) => { if (!m[e.field]) m[e.field] = e; });
    return m;
  }, [errors]);
  const warnByField = useMemo(() => {
    const m: Record<string, Issue> = {};
    warnings.forEach((w) => { if (!m[w.field]) m[w.field] = w; });
    return m;
  }, [warnings]);

  // Auto-focus the first problem field (or explicitly requested one)
  useEffect(() => {
    if (!row) return;
    const target =
      (focusField && (errByField[focusField] || warnByField[focusField]) ? focusField : null) ||
      errors[0]?.field ||
      warnings[0]?.field;
    if (!target) return;
    const t = setTimeout(() => {
      const el = fieldRefs.current[target];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        try { (el as HTMLInputElement).focus({ preventScroll: true }); } catch { /* noop */ }
      }
    }, 80);
    return () => clearTimeout(t);
  }, [row, focusField, errByField, warnByField, errors, warnings]);

  if (!row || !draft) {
    return (
      <Dialog open={false} onOpenChange={(o) => { if (!o) onCancel(); }}>
        <DialogContent />
      </Dialog>
    );
  }

  const set = <K extends keyof ReceivableRow>(k: K, v: ReceivableRow[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  // Field shell: applies highlight + helper text, registers ref
  function Field({
    name, label, children, full,
  }: { name: string; label: string; children: (cls: string, ref: (el: HTMLElement | null) => void) => React.ReactNode; full?: boolean }) {
    const err = errByField[name];
    const warn = !err ? warnByField[name] : undefined;
    const ring = err
      ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
      : warn
      ? "border-warning ring-1 ring-warning/40 bg-warning/5"
      : "";
    const setRef = (el: HTMLElement | null) => { fieldRefs.current[name] = el; };
    return (
      <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
        <div className="flex items-center justify-between gap-2">
          <Label className={cn(err && "text-destructive", warn && "text-warning")}>{label}</Label>
          {(err || warn) && <span className="text-[10px] font-mono text-muted-foreground">{name}</span>}
        </div>
        {children(ring, setRef)}
        {err && <div className="text-[11px] text-destructive">{err.problem}. {err.hint}</div>}
        {warn && <div className="text-[11px] text-warning">{warn.problem}. {warn.hint}</div>}
      </div>
    );
  }

  const allIssues = [...errors, ...warnings];

  return (
    <Dialog open={!!row} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-xl w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование строки импорта · #{draft.rowNum}</DialogTitle>
          <DialogDescription>
            Исправления применяются только к импортируемому файлу в этом приложении. Данные в 1С не изменяются.
          </DialogDescription>
        </DialogHeader>

        {allIssues.length > 0 ? (
          <div className={cn(
            "rounded-md border px-3 py-2 text-[12px]",
            errors.length > 0
              ? "border-destructive/30 bg-destructive/5"
              : "border-warning/30 bg-warning/5",
          )}>
            <div className={cn(
              "font-medium mb-1 flex items-center gap-1.5",
              errors.length > 0 ? "text-destructive" : "text-warning",
            )}>
              {errors.length > 0
                ? <><XCircle className="h-3.5 w-3.5" /> Нужно исправить:</>
                : <><AlertTriangle className="h-3.5 w-3.5" /> Обратите внимание:</>}
            </div>
            <ul className="space-y-0.5 pl-4 list-disc text-foreground/90">
              {allIssues.map((it, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => fieldRefs.current[it.field]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="text-left hover:underline"
                  >
                    {FIELD_LABELS[it.field] ?? it.field} — {it.problem}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-md border border-success/30 bg-success/5 px-3 py-2 text-[12px] text-success flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> В строке нет ошибок и предупреждений.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field name="receivable_id" label="ID дебиторки">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} value={draft.receivable_id} onChange={(e) => set("receivable_id", e.target.value)} />
          )}</Field>
          <Field name="клиент" label="Клиент">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} value={draft.клиент} onChange={(e) => set("клиент", e.target.value)} />
          )}</Field>
          <Field name="инн" label="ИНН">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} value={draft.инн} onChange={(e) => set("инн", e.target.value)} />
          )}</Field>
          <Field name="договор" label="Договор">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} value={draft.договор} onChange={(e) => set("договор", e.target.value)} />
          )}</Field>
          <Field name="менеджер" label="Менеджер" full>{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} value={draft.менеджер} onChange={(e) => set("менеджер", e.target.value)} />
          )}</Field>
          <Field name="сумма_долга" label="Сумма долга, ₽">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} type="number" inputMode="decimal"
              value={Number.isFinite(draft.сумма_долга) ? draft.сумма_долга : 0}
              onChange={(e) => set("сумма_долга", Number(e.target.value) || 0)} />
          )}</Field>
          <Field name="сумма_просрочки" label="Сумма просрочки, ₽">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} type="number" inputMode="decimal"
              value={Number.isFinite(draft.сумма_просрочки) ? draft.сумма_просрочки : 0}
              onChange={(e) => set("сумма_просрочки", Number(e.target.value) || 0)} />
          )}</Field>
          <Field name="дата_возникновения" label="Дата возникновения">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} type="date"
              value={toIsoDate(draft.дата_возникновения)}
              onChange={(e) => set("дата_возникновения", fromIsoDate(e.target.value))} />
          )}</Field>
          <Field name="дата_плановой_оплаты" label="Дата плановой оплаты">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} type="date"
              value={toIsoDate(draft.дата_плановой_оплаты)}
              onChange={(e) => set("дата_плановой_оплаты", fromIsoDate(e.target.value))} />
          )}</Field>
          <Field name="дней_просрочки" label="Дней просрочки">{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} type="number" inputMode="numeric"
              value={Number.isFinite(draft.дней_просрочки) ? draft.дней_просрочки : 0}
              onChange={(e) => set("дней_просрочки", Number(e.target.value) || 0)} />
          )}</Field>
          <Field name="статус_оплаты" label="Статус оплаты">{(cls, ref) => (
            <select
              ref={ref as React.Ref<HTMLSelectElement>}
              value={draft.статус_оплаты}
              onChange={(e) => set("статус_оплаты", e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                cls,
              )}
            >
              <option value="">— выберите —</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}</Field>
          <Field name="комментарий" label="Комментарий" full>{(cls, ref) => (
            <Input ref={ref as React.Ref<HTMLInputElement>} className={cls} value={draft.комментарий} onChange={(e) => set("комментарий", e.target.value)} />
          )}</Field>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Отмена</Button>
          <Button onClick={() => onSave(draft)}>
            <Wrench className="h-4 w-4" /> Сохранить и проверить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

