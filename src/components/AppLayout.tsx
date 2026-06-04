import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, Briefcase, GitBranch, Wallet, Building2,
  Target, ClipboardCheck, LineChart, Menu, X, ShieldCheck, Sun, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

const nav = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard, end: true },
  { to: "/managers", label: "Менеджеры", icon: Users },
  { to: "/deals", label: "Сделки", icon: Briefcase },
  { to: "/funnel", label: "Воронка продаж", icon: GitBranch },
  { to: "/receivables", label: "Дебиторка", icon: Wallet },
  { to: "/clients", label: "Клиенты", icon: Building2 },
  { to: "/plan-fact", label: "План-факт", icon: Target },
  { to: "/actions", label: "Контроль действий", icon: ClipboardCheck },
  { to: "/variance", label: "Аналитика отклонений", icon: LineChart },
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
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold"
              aria-label="Роль"
            >
              {roles.map((r) => <option key={r} value={r} className="text-foreground">{r}</option>)}
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

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-3 space-y-0.5 flex-1">
            {nav.map((item) => {
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
          </nav>
          <div className="p-4 border-t border-sidebar-border text-[11px] text-sidebar-foreground/60">
            Демо-данные · Май 2026
          </div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-30 top-16" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground p-3 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {nav.map((item) => {
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
