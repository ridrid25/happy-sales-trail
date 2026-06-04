// Демо-данные для управленческого дашборда качества продаж

export type RiskStatus = "норма" | "контроль" | "критично";
export type PaymentStatus = "оплачено" | "частично" | "ожидает" | "просрочено" | "проблемная";
export type ClientStatus = "надёжный" | "контроль" | "риск" | "стоп";
export type Stage =
  | "Новый лид"
  | "Контакт установлен"
  | "Потребность выявлена"
  | "КП отправлено"
  | "Переговоры"
  | "Счёт выставлен"
  | "Выиграна"
  | "Потеряна";

export type Manager = {
  id: string;
  name: string;
  title: string;
  plan: number;
  fact: number;
  margin: number; // валовая маржа руб
  marginPct: number; // %
  paid: number;
  receivable: number;
  overdue: number;
  avgPaymentDays: number;
  deals: number;
  lowMarginDeals: number;
  risk: RiskStatus;
  qualityIndex: number; // 0-100
};

export type Client = {
  id: string;
  name: string;
  manager: string;
  status: ClientStatus;
  totalSales: number;
  paid: number;
  receivable: number;
  overdue: number;
  maxOverdueDays: number;
  avgMarginPct: number;
  avgPaymentDays: number;
  problemDeals: number;
};

export type Deal = {
  id: string;
  client: string;
  manager: string;
  amount: number;
  cost: number;
  margin: number;
  marginPct: number;
  stage: Stage;
  saleDate: string;
  planPayDate: string;
  factPayDate?: string;
  paid: number;
  unpaid: number;
  overdueDays: number;
  paymentStatus: PaymentStatus;
  paymentTerms: string;
  discountReason?: string;
  comment?: string;
  cause?: string;
  responsible?: string;
};

export const monthPlan = 28_000_000;
export const monthFact = 24_350_000;
export const monthForecast = 26_800_000;
export const planMargin = 7_000_000;
export const factMargin = 5_460_000;
export const planPayments = 22_000_000;
export const factPayments = 17_200_000;
export const totalReceivable = 8_420_000;
export const overdueReceivable = 2_980_000;
export const avgPaymentDays = 34;
export const forecastIncoming = 19_100_000;
export const plannedOutflow = 21_400_000; // плановые расходы и обязательства месяца
export const cashGap = plannedOutflow - forecastIncoming; // 2,3 млн ₽
export const avgQualityIndex = 67; // среднее по команде

export const managers: Manager[] = [
  {
    id: "m1",
    name: "Иван Иванов",
    title: "Старший менеджер",
    plan: 6_000_000,
    fact: 7_080_000,
    margin: 1_120_000,
    marginPct: 15.8,
    paid: 4_100_000,
    receivable: 2_980_000,
    overdue: 1_240_000,
    avgPaymentDays: 47,
    deals: 12,
    lowMarginDeals: 4,
    risk: "критично",
    qualityIndex: 48,
  },
  {
    id: "m2",
    name: "Мария Соколова",
    title: "Менеджер",
    plan: 5_500_000,
    fact: 5_320_000,
    margin: 1_280_000,
    marginPct: 24.1,
    paid: 4_580_000,
    receivable: 740_000,
    overdue: 120_000,
    avgPaymentDays: 22,
    deals: 11,
    lowMarginDeals: 1,
    risk: "норма",
    qualityIndex: 84,
  },
  {
    id: "m3",
    name: "Алексей Петров",
    title: "Менеджер",
    plan: 5_500_000,
    fact: 4_910_000,
    margin: 980_000,
    marginPct: 19.9,
    paid: 3_650_000,
    receivable: 1_260_000,
    overdue: 480_000,
    avgPaymentDays: 31,
    deals: 9,
    lowMarginDeals: 2,
    risk: "контроль",
    qualityIndex: 66,
  },
  {
    id: "m4",
    name: "Екатерина Лаврова",
    title: "Менеджер",
    plan: 5_500_000,
    fact: 4_180_000,
    margin: 1_010_000,
    marginPct: 24.2,
    paid: 3_410_000,
    receivable: 770_000,
    overdue: 190_000,
    avgPaymentDays: 25,
    deals: 10,
    lowMarginDeals: 1,
    risk: "норма",
    qualityIndex: 78,
  },
  {
    id: "m5",
    name: "Сергей Минин",
    title: "Младший менеджер",
    plan: 5_500_000,
    fact: 2_860_000,
    margin: 1_070_000,
    marginPct: 37.4,
    paid: 1_790_000,
    receivable: 1_070_000,
    overdue: 950_000,
    avgPaymentDays: 52,
    deals: 8,
    lowMarginDeals: 0,
    risk: "контроль",
    qualityIndex: 58,
  },
];

export const clients: Client[] = [
  { id: "c1", name: "Альфа Логистика", manager: "Иван Иванов", status: "стоп", totalSales: 2_180_000, paid: 1_560_000, receivable: 620_000, overdue: 620_000, maxOverdueDays: 38, avgMarginPct: 14.2, avgPaymentDays: 56, problemDeals: 3 },
  { id: "c2", name: "Северсталь Digital", manager: "Мария Соколова", status: "надёжный", totalSales: 3_240_000, paid: 3_240_000, receivable: 0, overdue: 0, maxOverdueDays: 0, avgMarginPct: 26.4, avgPaymentDays: 18, problemDeals: 0 },
  { id: "c3", name: "Полюс Тех", manager: "Алексей Петров", status: "контроль", totalSales: 1_840_000, paid: 1_120_000, receivable: 720_000, overdue: 280_000, maxOverdueDays: 21, avgMarginPct: 20.1, avgPaymentDays: 34, problemDeals: 1 },
  { id: "c4", name: "Финтех Альфа", manager: "Мария Соколова", status: "надёжный", totalSales: 1_540_000, paid: 1_540_000, receivable: 0, overdue: 0, maxOverdueDays: 0, avgMarginPct: 28.6, avgPaymentDays: 14, problemDeals: 0 },
  { id: "c5", name: "Ростком Solutions", manager: "Екатерина Лаврова", status: "контроль", totalSales: 1_280_000, paid: 760_000, receivable: 520_000, overdue: 190_000, maxOverdueDays: 18, avgMarginPct: 22.8, avgPaymentDays: 28, problemDeals: 1 },
  { id: "c6", name: "ТрейдГранд", manager: "Иван Иванов", status: "риск", totalSales: 1_980_000, paid: 1_360_000, receivable: 620_000, overdue: 620_000, maxOverdueDays: 44, avgMarginPct: 12.4, avgPaymentDays: 60, problemDeals: 2 },
  { id: "c7", name: "Лига Ритейл", manager: "Сергей Минин", status: "риск", totalSales: 1_120_000, paid: 480_000, receivable: 640_000, overdue: 580_000, maxOverdueDays: 51, avgMarginPct: 31.2, avgPaymentDays: 62, problemDeals: 2 },
  { id: "c8", name: "СтудияМаркет", manager: "Сергей Минин", status: "контроль", totalSales: 740_000, paid: 310_000, receivable: 430_000, overdue: 370_000, maxOverdueDays: 29, avgMarginPct: 33.0, avgPaymentDays: 41, problemDeals: 1 },
  { id: "c9", name: "БиоТех Лаб", manager: "Алексей Петров", status: "надёжный", totalSales: 1_640_000, paid: 1_640_000, receivable: 0, overdue: 0, maxOverdueDays: 0, avgMarginPct: 24.0, avgPaymentDays: 20, problemDeals: 0 },
  { id: "c10", name: "Меркурий Сервис", manager: "Екатерина Лаврова", status: "надёжный", totalSales: 980_000, paid: 730_000, receivable: 250_000, overdue: 0, maxOverdueDays: 0, avgMarginPct: 25.8, avgPaymentDays: 22, problemDeals: 0 },
];

const mkDeal = (
  id: string, client: string, manager: string, amount: number, cost: number, stage: Stage,
  saleDate: string, planPayDate: string, paid: number, overdueDays: number,
  paymentStatus: PaymentStatus, paymentTerms: string, factPayDate?: string,
  discountReason?: string, cause?: string, responsible?: string, comment?: string
): Deal => {
  const margin = amount - cost;
  const marginPct = +(margin / amount * 100).toFixed(1);
  return {
    id, client, manager, amount, cost, margin, marginPct, stage,
    saleDate, planPayDate, factPayDate, paid, unpaid: amount - paid, overdueDays,
    paymentStatus, paymentTerms, discountReason, comment, cause, responsible,
  };
};

export const deals: Deal[] = [
  mkDeal("d01", "Альфа Логистика", "Иван Иванов", 980_000, 860_000, "Выиграна", "02.05", "16.05", 360_000, 38, "просрочено", "Отсрочка 14 дн", undefined, "Скидка для повторной отгрузки", "клиент не платит без причины", "клиент", "Запрос новой отгрузки заблокирован"),
  mkDeal("d02", "Альфа Логистика", "Иван Иванов", 620_000, 540_000, "Выиграна", "12.04", "26.04", 0, 58, "проблемная", "Отсрочка 14 дн", undefined, undefined, "клиент изначально рискованный", "менеджер", "Эскалация РОПу"),
  mkDeal("d03", "ТрейдГранд", "Иван Иванов", 1_140_000, 1_010_000, "Выиграна", "08.05", "22.05", 520_000, 32, "просрочено", "Отсрочка 14 дн", undefined, "Скидка 6% — большой объём", "менеджер дал слабые условия", "менеджер"),
  mkDeal("d04", "ТрейдГранд", "Иван Иванов", 840_000, 770_000, "Счёт выставлен", "20.05", "03.06", 0, 0, "ожидает", "Отсрочка 14 дн"),
  mkDeal("d05", "Северсталь Digital", "Мария Соколова", 1_240_000, 920_000, "Выиграна", "05.05", "12.05", 1_240_000, 0, "оплачено", "Предоплата 100%", "12.05"),
  mkDeal("d06", "Северсталь Digital", "Мария Соколова", 980_000, 740_000, "Выиграна", "18.05", "25.05", 980_000, 0, "оплачено", "Предоплата 100%", "23.05"),
  mkDeal("d07", "Финтех Альфа", "Мария Соколова", 760_000, 540_000, "Выиграна", "10.05", "17.05", 760_000, 0, "оплачено", "Отсрочка 7 дн", "16.05"),
  mkDeal("d08", "Финтех Альфа", "Мария Соколова", 540_000, 380_000, "Выиграна", "22.05", "29.05", 540_000, 0, "оплачено", "Отсрочка 7 дн", "28.05"),
  mkDeal("d09", "Полюс Тех", "Алексей Петров", 1_240_000, 980_000, "Выиграна", "11.05", "25.05", 720_000, 14, "частично", "Отсрочка 14 дн", undefined, undefined, "документы не выставлены вовремя", "бухгалтерия"),
  mkDeal("d10", "Полюс Тех", "Алексей Петров", 600_000, 480_000, "Счёт выставлен", "24.05", "07.06", 0, 0, "ожидает", "Отсрочка 14 дн"),
  mkDeal("d11", "Ростком Solutions", "Екатерина Лаврова", 740_000, 560_000, "Переговоры", "—", "—", 0, 0, "ожидает", "Обсуждается"),
  mkDeal("d12", "Ростком Solutions", "Екатерина Лаврова", 540_000, 410_000, "Выиграна", "06.05", "20.05", 350_000, 12, "частично", "Отсрочка 14 дн", undefined, undefined, "клиент задерживает оплату", "клиент"),
  mkDeal("d13", "Лига Ритейл", "Сергей Минин", 640_000, 410_000, "Выиграна", "01.05", "15.05", 60_000, 38, "просрочено", "Отсрочка 14 дн", undefined, "Скидка 4%", "менеджер дал слабые условия", "менеджер"),
  mkDeal("d14", "Лига Ритейл", "Сергей Минин", 480_000, 290_000, "Выиграна", "19.05", "02.06", 420_000, 8, "частично", "Отсрочка 14 дн", undefined, undefined, "закрывающие документы не подписаны", "юрист"),
  mkDeal("d15", "СтудияМаркет", "Сергей Минин", 320_000, 210_000, "Выиграна", "09.05", "23.05", 0, 28, "просрочено", "Отсрочка 14 дн", undefined, undefined, "клиент изначально рискованный", "менеджер"),
  mkDeal("d16", "СтудияМаркет", "Сергей Минин", 240_000, 160_000, "КП отправлено", "—", "—", 0, 0, "ожидает", "Отсрочка 7 дн"),
  mkDeal("d17", "БиоТех Лаб", "Алексей Петров", 1_240_000, 940_000, "Выиграна", "04.05", "11.05", 1_240_000, 0, "оплачено", "Предоплата 100%", "10.05"),
  mkDeal("d18", "БиоТех Лаб", "Алексей Петров", 400_000, 300_000, "Потребность выявлена", "—", "—", 0, 0, "ожидает", "Обсуждается"),
  mkDeal("d19", "Меркурий Сервис", "Екатерина Лаврова", 730_000, 540_000, "Выиграна", "13.05", "27.05", 730_000, 0, "оплачено", "Отсрочка 14 дн", "26.05"),
  mkDeal("d20", "Меркурий Сервис", "Екатерина Лаврова", 250_000, 190_000, "Счёт выставлен", "25.05", "08.06", 0, 0, "ожидает", "Отсрочка 14 дн"),
  mkDeal("d21", "Альфа Логистика", "Иван Иванов", 580_000, 510_000, "Переговоры", "—", "—", 0, 0, "ожидает", "Отсрочка 14 дн", undefined, undefined, undefined, "менеджер", "Новая отгрузка — требует согласования"),
  mkDeal("d22", "ТрейдГранд", "Иван Иванов", 460_000, 380_000, "КП отправлено", "—", "—", 0, 0, "ожидает", "Отсрочка 14 дн"),
  mkDeal("d23", "Финтех Альфа", "Мария Соколова", 320_000, 220_000, "Контакт установлен", "—", "—", 0, 0, "ожидает", "Обсуждается"),
  mkDeal("d24", "Полюс Тех", "Алексей Петров", 280_000, 220_000, "Новый лид", "—", "—", 0, 0, "ожидает", "—"),
  mkDeal("d25", "Лига Ритейл", "Сергей Минин", 180_000, 130_000, "Потеряна", "—", "—", 0, 0, "ожидает", "—", undefined, undefined, "не сошлись по цене", "менеджер"),
  mkDeal("d26", "Северсталь Digital", "Мария Соколова", 1_060_000, 760_000, "Счёт выставлен", "27.05", "10.06", 0, 0, "ожидает", "Предоплата 100%"),
  mkDeal("d27", "БиоТех Лаб", "Алексей Петров", 690_000, 510_000, "Переговоры", "—", "—", 0, 0, "ожидает", "Отсрочка 7 дн"),
  mkDeal("d28", "Меркурий Сервис", "Екатерина Лаврова", 410_000, 310_000, "КП отправлено", "—", "—", 0, 0, "ожидает", "Отсрочка 14 дн"),
  mkDeal("d29", "Альфа Логистика", "Иван Иванов", 760_000, 670_000, "Выиграна", "29.04", "13.05", 280_000, 41, "просрочено", "Отсрочка 14 дн", undefined, "Скидка 5%", "смешанная причина", "смешанная ответственность"),
  mkDeal("d30", "ТрейдГранд", "Иван Иванов", 560_000, 490_000, "Выиграна", "15.05", "29.05", 320_000, 5, "частично", "Отсрочка 14 дн", undefined, undefined, "клиент задерживает оплату", "клиент"),
  mkDeal("d31", "Северсталь Digital", "Мария Соколова", 820_000, 600_000, "Выиграна", "20.05", "27.05", 820_000, 0, "оплачено", "Отсрочка 7 дн", "27.05"),
  mkDeal("d32", "Полюс Тех", "Алексей Петров", 460_000, 360_000, "Выиграна", "16.05", "30.05", 460_000, 0, "оплачено", "Отсрочка 14 дн", "29.05"),
  mkDeal("d33", "Ростком Solutions", "Екатерина Лаврова", 1_240_000, 900_000, "Выиграна", "07.05", "21.05", 1_240_000, 0, "оплачено", "Отсрочка 14 дн", "20.05"),
  mkDeal("d34", "Ростком Solutions", "Екатерина Лаврова", 680_000, 540_000, "Счёт выставлен", "28.05", "11.06", 0, 0, "ожидает", "Отсрочка 14 дн"),
  mkDeal("d35", "Лига Ритейл", "Сергей Минин", 540_000, 400_000, "Выиграна", "12.05", "26.05", 250_000, 9, "частично", "Отсрочка 14 дн", undefined, undefined, "документы не выставлены вовремя", "бухгалтерия"),
  mkDeal("d36", "СтудияМаркет", "Сергей Минин", 280_000, 200_000, "Выиграна", "18.05", "01.06", 280_000, 0, "оплачено", "Предоплата 100%", "18.05"),
  mkDeal("d37", "БиоТех Лаб", "Алексей Петров", 360_000, 280_000, "Счёт выставлен", "26.05", "09.06", 0, 0, "ожидает", "Отсрочка 14 дн"),
  mkDeal("d38", "Меркурий Сервис", "Екатерина Лаврова", 560_000, 420_000, "Выиграна", "21.05", "04.06", 560_000, 0, "оплачено", "Предоплата 100%", "21.05"),
  mkDeal("d39", "Финтех Альфа", "Мария Соколова", 380_000, 280_000, "Выиграна", "23.05", "30.05", 380_000, 0, "оплачено", "Отсрочка 7 дн", "30.05"),
  mkDeal("d40", "Полюс Тех", "Алексей Петров", 240_000, 190_000, "Потеряна", "—", "—", 0, 0, "ожидает", "—"),
];

export type RedFlag = {
  title: string;
  severity: "high" | "medium";
  area: string;
  amount?: string;
  who?: string;
  action: string;
};

export const redFlags: RedFlag[] = [
  {
    title: "Менеджер выполнил план по выручке, но провалил план по оплатам",
    severity: "high", area: "Менеджеры",
    amount: "118% плана продаж · 58% плана оплат",
    who: "Иван Иванов",
    action: "Ввести KPI по оплаченной выручке, ограничить отсрочку по новым сделкам",
  },
  {
    title: "Крупный клиент с просрочкой просит новую сделку с отсрочкой",
    severity: "high", area: "Клиенты",
    amount: "Просрочка 620 000 ₽ · новая сделка 580 000 ₽",
    who: "«Альфа Логистика» (Иван Иванов)",
    action: "Заблокировать отгрузку до согласования с финдиректором",
  },
  {
    title: "Сделки проданы ниже минимальной маржи",
    severity: "high", area: "Маржа",
    amount: "5 сделок · средняя маржа 11,8%",
    who: "Иван Иванов (4), Сергей Минин (1)",
    action: "Разбор скидок, утвердить регламент минимальной маржи 15%",
  },
  {
    title: "Менеджер продаёт много, но создаёт рост дебиторки",
    severity: "high", area: "Качество продаж",
    amount: "Дебиторка 2,98 млн ₽ · просрочка 1,24 млн ₽",
    who: "Иван Иванов",
    action: "Перевод части портфеля на предоплату, разбор 3 крупнейших клиентов",
  },
  {
    title: "Прогноз оплат ниже плана — риск кассового разрыва",
    severity: "high", area: "Деньги",
    amount: "Разрыв 2,3 млн ₽ к концу месяца",
    who: "Финдиректор",
    action: "Ускорить сбор дебиторки, перенести часть платежей поставщикам",
  },
  {
    title: "Часть выручки месяца не оплачена",
    severity: "medium", area: "План-факт",
    amount: "7,15 млн ₽ (29% факта) · план оплат выполнен на 78%",
    who: "Отдел продаж",
    action: "Разобрать сделки с отсрочкой > 14 дн, ускорить выставление документов",
  },
  {
    title: "Клиенты в статусе «риск» / «стоп» продолжают получать отгрузки",
    severity: "medium", area: "Клиенты",
    amount: "3 клиента · 1,87 млн ₽ просрочки",
    who: "«Альфа Логистика», «ТрейдГранд», «Лига Ритейл»",
    action: "Закрыть отгрузку до погашения просрочки",
  },
  {
    title: "Сделки без следующего действия больше 7 дней",
    severity: "medium", area: "Воронка",
    amount: "6 сделок на 4,2 млн ₽",
    who: "Алексей Петров (3), Сергей Минин (2), Екатерина Лаврова (1)",
    action: "Назначить следующий шаг по каждой сделке до конца дня",
  },
];

export const funnelStages: { stage: Stage; count: number; amount: number; conversion: number; avgDays: number; overdueActions: number; expectedMargin: number; expectedPayments: number }[] = [
  { stage: "Новый лид", count: 14, amount: 4_200_000, conversion: 68, avgDays: 2, overdueActions: 2, expectedMargin: 920_000, expectedPayments: 0 },
  { stage: "Контакт установлен", count: 11, amount: 3_640_000, conversion: 72, avgDays: 3, overdueActions: 1, expectedMargin: 820_000, expectedPayments: 0 },
  { stage: "Потребность выявлена", count: 9, amount: 3_100_000, conversion: 65, avgDays: 4, overdueActions: 2, expectedMargin: 720_000, expectedPayments: 0 },
  { stage: "КП отправлено", count: 8, amount: 2_780_000, conversion: 58, avgDays: 5, overdueActions: 3, expectedMargin: 640_000, expectedPayments: 0 },
  { stage: "Переговоры", count: 6, amount: 2_140_000, conversion: 60, avgDays: 6, overdueActions: 1, expectedMargin: 510_000, expectedPayments: 0 },
  { stage: "Счёт выставлен", count: 7, amount: 3_460_000, conversion: 85, avgDays: 4, overdueActions: 1, expectedMargin: 740_000, expectedPayments: 2_940_000 },
  { stage: "Выиграна", count: 22, amount: 16_640_000, conversion: 100, avgDays: 0, overdueActions: 0, expectedMargin: 3_280_000, expectedPayments: 12_120_000 },
  { stage: "Потеряна", count: 3, amount: 760_000, conversion: 0, avgDays: 0, overdueActions: 0, expectedMargin: 0, expectedPayments: 0 },
];

export const planFactTrend = [
  { period: "Нед 1", plan: 7_000_000, fact: 6_200_000, paid: 4_800_000 },
  { period: "Нед 2", plan: 7_000_000, fact: 6_400_000, paid: 5_100_000 },
  { period: "Нед 3", plan: 7_000_000, fact: 6_100_000, paid: 4_300_000 },
  { period: "Нед 4", plan: 7_000_000, fact: 5_650_000, paid: 3_000_000 },
];

export const varianceAnalysis = [
  { area: "Почему не выполнен план продаж", metric: "План / факт по выручке", deviation: "−3,65 млн ₽ (−13%)", cause: "Слабый pipeline у Сергея Минина (52% плана) и потеря 2 крупных сделок в SMB-сегменте на 1,4 млн ₽", action: "Разобрать причины потерь, усилить квалификацию лидов, поставить Сергею промежуточные цели по pipeline", owner: "РОП" },
  { area: "Почему не выполнен план оплат", metric: "План / факт оплат", deviation: "−4,8 млн ₽ (−22%)", cause: "Просрочка 1,87 млн ₽ у 3 клиентов «Альфа Логистика», «ТрейдГранд», «Лига Ритейл» — все на отсрочке 14 дн", action: "Заблокировать новые отгрузки этим клиентам до погашения, перевести на предоплату 50%", owner: "РОП + Финдиректор" },
  { area: "Почему просела маржа", metric: "Средняя маржинальность", deviation: "−3,2 п.п. к плану (22,4% vs 25%)", cause: "5 сделок проданы ниже минимального порога 15% — скидки 4–6% на крупных сделках Ивана Иванова", action: "Утвердить регламент: сделки <15% маржи требуют согласования РОПа. Разбор скидок по 5 сделкам Ивана", owner: "РОП" },
  { area: "Почему выросла дебиторка", metric: "Дебиторская задолженность", deviation: "+1,24 млн ₽ за месяц", cause: "Новые отгрузки клиентам в статусе «риск» и «контроль» без согласования с финдиректором", action: "Ввести обязательное согласование сделок с отсрочкой для клиентов «риск»/«стоп». Лимит на менеджера", owner: "Финдиректор" },
  { area: "Где зависли сделки", metric: "Сделки на этапе КП > 7 дней", deviation: "8 сделок на 2,78 млн ₽", cause: "Отсутствует follow-up по 5 сделкам у Алексея и Сергея — нет назначенного следующего шага", action: "Назначить конкретный следующий шаг и срок по каждой сделке до конца дня. Контроль РОПа ежедневно", owner: "РОП" },
  { area: "Какие клиенты создают риск", metric: "Доля просрочки в выручке клиента", deviation: ">30% у 3 клиентов", cause: "«Альфа Логистика» (38% просрочки), «ТрейдГранд» (34%), «Лига Ритейл» (52%) — системные задержки оплат", action: "Перевести в статус «стоп», блокировать новые отгрузки до погашения. Согласовать график оплат", owner: "Финдиректор" },
  { area: "Какие менеджеры требуют внимания", metric: "Индекс качества продаж", deviation: "48 / 100 — Иван Иванов", cause: "118% плана по выручке, но маржа 15,8% и просрочка 1,24 млн ₽ — продаёт ниже минимальной маржи проблемным клиентам", action: "Ввести KPI по оплаченной выручке и марже. Разбор 3 крупнейших сделок Ивана на этой неделе", owner: "РОП" },
];

export const actions = [
  { title: "Согласовать новую отгрузку клиенту «Альфа Логистика»", owner: "Иван Иванов", due: "сегодня", priority: "Высокий", overdue: false },
  { title: "Разобрать просрочку 620 000 ₽ по «ТрейдГранд»", owner: "Иван Иванов", due: "вчера", priority: "Высокий", overdue: true },
  { title: "Подписать закрывающие документы по «Лига Ритейл»", owner: "Сергей Минин", due: "сегодня", priority: "Средний", overdue: false },
  { title: "Выставить счёт по «Полюс Тех»", owner: "Алексей Петров", due: "позавчера", priority: "Средний", overdue: true },
  { title: "Follow-up по «БиоТех Лаб» — этап Переговоры > 6 дней", owner: "Алексей Петров", due: "завтра", priority: "Средний", overdue: false },
  { title: "Подтвердить условия оплаты с «Ростком Solutions»", owner: "Екатерина Лаврова", due: "сегодня", priority: "Низкий", overdue: false },
  { title: "Перевести «СтудияМаркет» в статус «контроль»", owner: "РОП", due: "до конца недели", priority: "Средний", overdue: false },
];

export const formatRub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export const formatNum = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export const formatShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + " млн";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + " тыс";
  return String(n);
};

export const riskColor: Record<RiskStatus, string> = {
  "норма": "bg-success/10 text-success border-success/20",
  "контроль": "bg-warning/10 text-warning border-warning/30",
  "критично": "bg-destructive/10 text-destructive border-destructive/20",
};

export const clientStatusColor: Record<ClientStatus, string> = {
  "надёжный": "bg-success/10 text-success border-success/20",
  "контроль": "bg-warning/10 text-warning border-warning/30",
  "риск": "bg-destructive/10 text-destructive border-destructive/20",
  "стоп": "bg-destructive text-destructive-foreground border-destructive",
};

export const paymentStatusColor: Record<PaymentStatus, string> = {
  "оплачено": "bg-success/10 text-success border-success/20",
  "частично": "bg-accent/10 text-accent border-accent/20",
  "ожидает": "bg-muted text-muted-foreground border-border",
  "просрочено": "bg-destructive/10 text-destructive border-destructive/20",
  "проблемная": "bg-destructive text-destructive-foreground border-destructive",
};
