// Locally-running receivables import: CSV/JSON parse + validation.
// Runs entirely in the browser. No network, no backend.

import { managers as demoManagers } from "@/data/demo";

export const REQUIRED_FIELDS = [
  "receivable_id", "клиент", "инн", "менеджер",
  "сумма_долга", "дата_плановой_оплаты", "статус_оплаты",
] as const;

export const ALL_FIELDS = [
  "receivable_id", "клиент", "инн", "договор", "менеджер",
  "сумма_долга", "сумма_просрочки", "дата_возникновения",
  "дата_плановой_оплаты", "дней_просрочки", "статус_оплаты", "комментарий",
] as const;

export type ReceivableRow = {
  rowNum: number; // 1-based row in source file (excluding header)
  receivable_id: string;
  клиент: string;
  инн: string;
  договор: string;
  менеджер: string;
  сумма_долга: number;
  сумма_просрочки: number;
  дата_возникновения: string;
  дата_плановой_оплаты: string;
  дней_просрочки: number;
  статус_оплаты: string;
  комментарий: string;
  стоимость_просрочки: number;
};

export type Issue = {
  row: number;
  field: string;
  problem: string;
  hint: string;
};

export type ParseResult = {
  rows: ReceivableRow[];
  errors: Issue[];
  warnings: Issue[];
};

const FINANCE_RATE = 0.24;

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null) return NaN;
  const s = String(v).trim().replace(/\s+/g, "").replace(",", ".");
  if (s === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function calcCost(overdueSum: number, days: number): number {
  if (!Number.isFinite(overdueSum) || !Number.isFinite(days) || overdueSum <= 0 || days <= 0) return 0;
  return Math.round(overdueSum * FINANCE_RATE * days / 365);
}

// --- CSV parsing (supports quotes, commas/semicolons) ---
export function parseCSV(text: string): Record<string, string>[] {
  // strip BOM
  text = text.replace(/^\uFEFF/, "");
  const lines: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if ((ch === "\n" || ch === "\r") && !inQ) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      lines.push(cur); cur = "";
    } else cur += ch;
  }
  if (cur.length) lines.push(cur);
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  if (nonEmpty.length < 2) return [];
  // detect delimiter from header
  const header = nonEmpty[0];
  const delim = header.includes(";") && !header.includes(",") ? ";" : ",";
  const split = (line: string) => {
    const out: string[] = []; let buf = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { buf += '"'; i++; }
        else q = !q;
      } else if (ch === delim && !q) { out.push(buf); buf = ""; }
      else buf += ch;
    }
    out.push(buf);
    return out.map((s) => s.trim());
  };
  const headers = split(nonEmpty[0]);
  return nonEmpty.slice(1).map((line) => {
    const cells = split(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ""; });
    return obj;
  });
}

export function buildTemplateCSV(): string {
  const header = ALL_FIELDS.join(",");
  const sample = [
    ["R-0001", "Альфа Логистика", "7701234567", "ДГ-100/24", "Иван Иванов", "620000", "360000", "01.04.2026", "01.05.2026", "38", "просрочено", "клиент не платит без причины"],
    ["R-0002", "Полюс Тех", "7707654321", "ДГ-102/24", "Алексей Петров", "720000", "280000", "10.04.2026", "10.05.2026", "21", "частично", ""],
    ["R-0003", "Северсталь Digital", "7809988776", "ДГ-201/24", "Мария Соколова", "0", "0", "", "", "0", "оплачено", "закрыто в срок"],
  ].map((r) => r.map((c) => /[",\n;]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(","));
  // Prepend UTF-8 BOM so Excel on Windows opens Cyrillic correctly.
  return "\uFEFF" + [header, ...sample].join("\n");
}

// Re-run validation on already-normalized rows (e.g. after inline edits),
// preserving the original source rowNum so issue references stay stable.
export function revalidate(rows: ReceivableRow[]): ParseResult {
  const out: ReceivableRow[] = [];
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  rows.forEach((r) => {
    const res = normalize(r as unknown as Record<string, unknown>, r.rowNum);
    out.push(res.row);
    errors.push(...res.errors);
    warnings.push(...res.warnings);
  });
  return { rows: out, errors, warnings };
}

const VALID_STATUSES = new Set([
  "оплачено", "частично", "ожидает", "просрочено", "проблемная",
]);

function normalize(rec: Record<string, unknown>, rowNum: number): { row: ReceivableRow; errors: Issue[]; warnings: Issue[] } {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const get = (k: string) => {
    const v = rec[k];
    return v == null ? "" : String(v).trim();
  };

  const debt = toNumber(rec["сумма_долга"]);
  const overdue = toNumber(rec["сумма_просрочки"]);
  const days = toNumber(rec["дней_просрочки"]);

  const row: ReceivableRow = {
    rowNum,
    receivable_id: get("receivable_id"),
    клиент: get("клиент"),
    инн: get("инн"),
    договор: get("договор"),
    менеджер: get("менеджер"),
    сумма_долга: Number.isFinite(debt) ? debt : 0,
    сумма_просрочки: Number.isFinite(overdue) ? overdue : 0,
    дата_возникновения: get("дата_возникновения"),
    дата_плановой_оплаты: get("дата_плановой_оплаты"),
    дней_просрочки: Number.isFinite(days) ? days : 0,
    статус_оплаты: get("статус_оплаты").toLowerCase(),
    комментарий: get("комментарий"),
    стоимость_просрочки: 0,
  };
  row.стоимость_просрочки = calcCost(row.сумма_просрочки, row.дней_просрочки);

  // critical checks
  if (!row.receivable_id) errors.push({ row: rowNum, field: "receivable_id", problem: "не указан receivable_id", hint: "проверьте выгрузку дебиторки в 1С" });
  if (!row.клиент) errors.push({ row: rowNum, field: "клиент", problem: "не указан клиент", hint: "клиент обязателен для расчёта дебиторки" });
  if (!row.инн) errors.push({ row: rowNum, field: "инн", problem: "не указан ИНН", hint: "ИНН нужен для дедупликации клиентов" });
  if (!row.менеджер) errors.push({ row: rowNum, field: "менеджер", problem: "не указан менеджер", hint: "менеджер нужен для распределения ответственности" });
  if (!Number.isFinite(debt)) errors.push({ row: rowNum, field: "сумма_долга", problem: "сумма долга не указана или нечисловая", hint: "проверьте формат суммы" });
  else if (debt < 0) errors.push({ row: rowNum, field: "сумма_долга", problem: "сумма долга меньше 0", hint: "отрицательная задолженность не допускается" });
  if (Number.isFinite(overdue) && Number.isFinite(debt) && overdue > debt) {
    errors.push({ row: rowNum, field: "сумма_просрочки", problem: "сумма просрочки больше суммы долга", hint: "проверьте выгрузку дебиторки в 1С" });
  }
  if (Number.isFinite(overdue) && overdue > 0 && (!Number.isFinite(days) || days <= 0)) {
    errors.push({ row: rowNum, field: "дней_просрочки", problem: "есть просрочка, но не указаны дни просрочки", hint: "укажите количество дней просрочки" });
  }
  if (!row.дата_плановой_оплаты) errors.push({ row: rowNum, field: "дата_плановой_оплаты", problem: "не указана дата плановой оплаты", hint: "обязательное поле" });
  if (!row.статус_оплаты) errors.push({ row: rowNum, field: "статус_оплаты", problem: "не указан статус оплаты", hint: "обязательное поле" });
  else if (!VALID_STATUSES.has(row.статус_оплаты)) {
    errors.push({ row: rowNum, field: "статус_оплаты", problem: `неизвестный статус «${row.статус_оплаты}»`, hint: "допустимо: оплачено, частично, ожидает, просрочено, проблемная" });
  } else {
    // status consistency vs sums
    const st = row.статус_оплаты;
    if (st === "оплачено" && row.сумма_долга > 0) errors.push({ row: rowNum, field: "статус_оплаты", problem: "статус «оплачено», но сумма долга > 0", hint: "обновите статус или сумму долга" });
    if (st === "просрочено" && row.сумма_просрочки <= 0) errors.push({ row: rowNum, field: "статус_оплаты", problem: "статус «просрочено», но сумма просрочки = 0", hint: "проверьте сумму просрочки" });
  }

  // warnings
  if (!row.комментарий) warnings.push({ row: rowNum, field: "комментарий", problem: "нет комментария", hint: "комментарий помогает понять причину долга" });
  if (!row.договор) warnings.push({ row: rowNum, field: "договор", problem: "договор не указан", hint: "укажите номер договора" });
  if (row.дней_просрочки > 60) warnings.push({ row: rowNum, field: "дней_просрочки", problem: "просрочка больше 60 дней", hint: "критичный срок — требуется действие" });
  if (row.сумма_просрочки > 500_000) warnings.push({ row: rowNum, field: "сумма_просрочки", problem: "клиент имеет просрочку больше 500 000 ₽", hint: "вынести в приоритетные действия" });
  const knownMgr = new Set(demoManagers.map((m) => m.name));
  if (row.менеджер && !knownMgr.has(row.менеджер)) {
    warnings.push({ row: rowNum, field: "менеджер", problem: "менеджер не найден в текущих demo-data", hint: "проверьте справочник менеджеров" });
  }

  return { row, errors, warnings };
}

export function validateRecords(records: Record<string, unknown>[]): ParseResult {
  const rows: ReceivableRow[] = [];
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  records.forEach((rec, i) => {
    const res = normalize(rec, i + 2); // +2 — header is row 1, data starts at row 2
    rows.push(res.row);
    errors.push(...res.errors);
    warnings.push(...res.warnings);
  });
  return { rows, errors, warnings };
}

export async function parseFile(file: File): Promise<{ records: Record<string, unknown>[]; format: "CSV" | "JSON" }> {
  const name = file.name.toLowerCase();
  const text = await file.text();
  if (name.endsWith(".json")) {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : Array.isArray((data as { rows?: unknown[] }).rows) ? (data as { rows: unknown[] }).rows : [];
    return { records: arr as Record<string, unknown>[], format: "JSON" };
  }
  if (name.endsWith(".csv")) {
    return { records: parseCSV(text), format: "CSV" };
  }
  throw new Error("UNSUPPORTED_FORMAT");
}

export function summarize(result: ParseResult) {
  const rows = result.rows;
  const totalDebt = rows.reduce((s, r) => s + (r.сумма_долга || 0), 0);
  const totalOverdue = rows.reduce((s, r) => s + (r.сумма_просрочки || 0), 0);
  const totalCost = rows.reduce((s, r) => s + (r.стоимость_просрочки || 0), 0);
  const overdueRows = rows.filter((r) => r.сумма_просрочки > 0);
  const avgDays = overdueRows.length
    ? Math.round(overdueRows.reduce((s, r) => s + r.дней_просрочки, 0) / overdueRows.length)
    : 0;
  const overduePct = totalDebt > 0 ? Math.round((totalOverdue / totalDebt) * 1000) / 10 : 0;
  const clientsOverdue = new Set(overdueRows.map((r) => r.инн || r.клиент)).size;
  return { totalDebt, totalOverdue, totalCost, avgDays, overduePct, clientsOverdue };
}
