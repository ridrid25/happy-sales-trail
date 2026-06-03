export type SalesRep = {
  id: string;
  name: string;
  initials: string;
  team: string;
  title: string;
  revenue: number;
  target: number;
  deals: number;
  points: number;
  level: number;
  streak: number;
  badges: string[];
};

export type Deal = {
  id: string;
  rep: string;
  client: string;
  amount: number;
  status: "won" | "in_progress" | "negotiation";
  closedAt: string;
};

export type Contest = {
  id: string;
  title: string;
  description: string;
  prize: string;
  endsAt: string;
  progress: number;
  participants: number;
  leader: string;
};

export const reps: SalesRep[] = [
  {
    id: "1",
    name: "Алексей Воронин",
    initials: "АВ",
    team: "Enterprise",
    title: "Senior Account Executive",
    revenue: 4_820_000,
    target: 4_500_000,
    deals: 18,
    points: 9840,
    level: 12,
    streak: 14,
    badges: ["Закрыватель квартала", "Хантер", "100% плана ×3"],
  },
  {
    id: "2",
    name: "Мария Соколова",
    initials: "МС",
    team: "Mid-Market",
    title: "Account Executive",
    revenue: 4_310_000,
    target: 4_000_000,
    deals: 22,
    points: 9120,
    level: 11,
    streak: 9,
    badges: ["Скоростной лидер", "Топ-апселл"],
  },
  {
    id: "3",
    name: "Игорь Демидов",
    initials: "ИД",
    team: "Enterprise",
    title: "Account Executive",
    revenue: 3_905_000,
    target: 4_000_000,
    deals: 15,
    points: 8460,
    level: 10,
    streak: 6,
    badges: ["Аналитик сделок"],
  },
  {
    id: "4",
    name: "Екатерина Лаврова",
    initials: "ЕЛ",
    team: "SMB",
    title: "Sales Manager",
    revenue: 3_240_000,
    target: 3_000_000,
    deals: 31,
    points: 7890,
    level: 9,
    streak: 11,
    badges: ["Активист холодных звонков", "Серия 10+"],
  },
  {
    id: "5",
    name: "Дмитрий Орлов",
    initials: "ДО",
    team: "Mid-Market",
    title: "Account Executive",
    revenue: 2_980_000,
    target: 3_500_000,
    deals: 14,
    points: 6720,
    level: 8,
    streak: 4,
    badges: ["Новая звезда"],
  },
  {
    id: "6",
    name: "Анна Кравцова",
    initials: "АК",
    team: "SMB",
    title: "Junior AE",
    revenue: 2_410_000,
    target: 2_500_000,
    deals: 19,
    points: 5980,
    level: 7,
    streak: 3,
    badges: ["Быстрый старт"],
  },
  {
    id: "7",
    name: "Сергей Минин",
    initials: "СМ",
    team: "Enterprise",
    title: "Account Executive",
    revenue: 2_100_000,
    target: 3_000_000,
    deals: 9,
    points: 4880,
    level: 6,
    streak: 2,
    badges: ["Командный игрок"],
  },
];

export const recentDeals: Deal[] = [
  { id: "d1", rep: "Алексей Воронин", client: "Северсталь Digital", amount: 980_000, status: "won", closedAt: "2 ч назад" },
  { id: "d2", rep: "Мария Соколова", client: "Финтех Альфа", amount: 540_000, status: "won", closedAt: "4 ч назад" },
  { id: "d3", rep: "Екатерина Лаврова", client: "Ростком Solutions", amount: 312_000, status: "negotiation", closedAt: "сегодня" },
  { id: "d4", rep: "Игорь Демидов", client: "Полюс Тех", amount: 1_240_000, status: "in_progress", closedAt: "вчера" },
  { id: "d5", rep: "Дмитрий Орлов", client: "Лига Ритейл", amount: 420_000, status: "won", closedAt: "вчера" },
  { id: "d6", rep: "Анна Кравцова", client: "СтудияМаркет", amount: 185_000, status: "won", closedAt: "2 дня назад" },
];

export const contests: Contest[] = [
  {
    id: "c1",
    title: "Золотой квартал",
    description: "Закрыть максимум выручки за Q2 в сегменте Enterprise.",
    prize: "Поездка в Дубай + 250 000 ₽",
    endsAt: "23 дня",
    progress: 68,
    participants: 12,
    leader: "Алексей Воронин",
  },
  {
    id: "c2",
    title: "Скорость закрытия",
    description: "Минимальный средний цикл сделки за месяц.",
    prize: "AirPods Pro + 50 000 ₽",
    endsAt: "9 дней",
    progress: 82,
    participants: 18,
    leader: "Мария Соколова",
  },
  {
    id: "c3",
    title: "Хантер новых логотипов",
    description: "Больше всего сделок с новыми клиентами.",
    prize: "Премиум-абонемент + 75 000 ₽",
    endsAt: "16 дней",
    progress: 45,
    participants: 24,
    leader: "Екатерина Лаврова",
  },
];

export const teamStats = {
  revenue: 23_765_000,
  target: 26_000_000,
  deals: 128,
  avgCheck: 185_700,
  conversion: 32.4,
  activeReps: 24,
};

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(n);
