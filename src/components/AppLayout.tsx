import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, Briefcase, GitBranch, Wallet, Building2,
  Target, ClipboardCheck, LineChart, Menu, X, ShieldCheck, Sun, Moon, Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

const navGroups: { title: string; items: { to: string; label: string; icon: any; end?: boolean }[] }[] = [
  {
    title: "Основное",
    items: [
      { to: "/", label: "Дашборд", icon: LayoutDashboard, end: true },
      { to: "/managers", label: "Менеджеры", icon: Users },
      { to: "/deals", label: "Сделки", icon: Briefcase },
      { to: "/receivables", label: "Дебиторка", icon: Wallet },
      { to: "/clients", label: "Клиенты", icon: Building2 },
    ],
  },
  {
    title: "Управление",
    items: [
      { to: "/variance", label: "Риски и отклонения", icon: LineChart },
      { to: "/actions", label: "Контроль действий", icon: ClipboardCheck },
      { to: "/plan-fact", label: "План-факт", icon: Target },
    ],
  },
  {
    title: "Аналитика",
    items: [
      { to: "/funnel", label: "Воронка продаж", icon: GitBranch },
    ],
  },
  {
    title: "Администрирование",
    items: [
      { to: "/import-1c", label: "Импорт из 1С", icon: Database },
    ],
  },
];

const nav = navGroups.flatMap((g) => g.items);

type QuickTab = { id: string; label: string; section: string };

const quickTabs: QuickTab[] = [
  { id: "status", label: "Статус", section: "section-status" },
  { id: "money", label: "Деньги", section: "section-money" },
  { id: "actions", label: "Действия", section: "section-actions" },
  { id: "risks", label: "Риски", section: "section-risks" },
];


const roles = ["Собственник", "РОП", "Финдиректор", "Менеджер"];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("Собственник");
  const location = useLocation();
  

  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-header text-header-foreground border-b border-header/50 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-4 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-md"
              onClick={() => setOpen(!open)}
              aria-label="Меню"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-md bg-gold flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-header" />
              </div>
              <div className="leading-tight">
                <div className="font-display font-semibold text-[15px] text-white">Контроль качества продаж</div>
                <div className="text-[11px] text-white/55 hidden sm:block">Управленческий дашборд</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors border border-white/10"
              aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold"
              aria-label="Роль"
            >
              {roles.map((r) => <option key={r} value={r} className="text-foreground bg-card">{r}</option>)}
            </select>
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
                АН
              </div>
              <div className="text-sm leading-tight">
                <div className="font-medium">Антон Новиков</div>
                <div className="text-[11px] text-white/55">Май 2026</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile quick-tabs strip — только на главном дашборде */}
      {location.pathname === "/" && (
        <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-3 py-2">
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-muted/60 border border-border">
              {quickTabs.map((t) => {
                const handleClick = () => {
                  const el = document.getElementById(t.section);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                };
                return (
                  <button
                    key={t.id}
                    onClick={handleClick}
                    className={cn(
                      "h-8 w-full rounded-md text-[12px] font-medium text-center transition-colors",
                      "text-foreground/80 hover:bg-background/70 active:bg-accent active:text-accent-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}


      <div className="flex">

        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-3 space-y-3 flex-1 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.title}>
                <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-white font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border text-[11px] text-sidebar-foreground/60">
            Демо-данные · Май 2026
          </div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-30 top-16" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground p-3 overflow-y-auto space-y-3" onClick={(e) => e.stopPropagation()}>
              {navGroups.map((group) => (
                <div key={group.title}>
                  <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm",
                            isActive ? "bg-sidebar-accent text-white font-medium" : "hover:bg-sidebar-accent/60"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </aside>
          </div>
        )}


        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
