import { Trophy, Flame, Target, TrendingUp, Award, Crown, Zap, Users, Clock, Sparkles, ArrowUpRight, Medal } from "lucide-react";
import { contests, formatCurrency, formatNumber, recentDeals, reps, teamStats } from "@/data/demo";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sortedReps = [...reps].sort((a, b) => b.points - a.points);
const top = sortedReps[0];

const Index = () => {
  const teamProgress = Math.round((teamStats.revenue / teamStats.target) * 100);

  return (
    <div className="min-h-screen bg-navy-gradient">
      <div className="bg-glow">
        {/* Header */}
        <header className="border-b border-border/60 backdrop-blur-sm">
          <div className="container flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-gradient shadow-gold">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display text-xl leading-none">Apex</div>
                <div className="text-xs text-muted-foreground">Sales Motivation Suite</div>
              </div>
            </div>
            <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
              <a className="text-foreground transition-colors hover:text-gold" href="#dashboard">Дашборд</a>
              <a className="transition-colors hover:text-gold" href="#leaderboard">Лидерборд</a>
              <a className="transition-colors hover:text-gold" href="#contests">Конкурсы</a>
              <a className="transition-colors hover:text-gold" href="#activity">Активность</a>
            </nav>
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <div className="text-xs text-muted-foreground">Q2 2026 · Sales Team</div>
                <div className="text-sm font-medium">Москва · Online</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-secondary text-sm font-semibold text-gold">
                АВ
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section id="dashboard" className="container py-14">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-secondary/60 px-3 py-1 text-xs uppercase tracking-widest text-gold">
                <Sparkles className="h-3 w-3" /> Квартал в разгаре
              </div>
              <h1 className="font-display text-5xl leading-tight md:text-6xl">
                Превратите продажи в <span className="gold-text-gradient">соревнование</span>, в котором побеждают все
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
                Apex объединяет KPI, бонусы, лидерборды и корпоративные челленджи в одной премиум-платформе.
                Команда видит цель, фокус и награду — каждый день.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button className="bg-gold-gradient text-primary-foreground shadow-gold hover:opacity-90">
                  Запустить новый конкурс
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-gold/40 bg-transparent text-gold hover:bg-secondary hover:text-gold-light">
                  Посмотреть отчёт квартала
                </Button>
              </div>
            </div>

            {/* Team progress card */}
            <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-card p-7 shadow-elegant">
              <div className="absolute inset-x-0 top-0 h-px shimmer" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Командный план Q2</div>
                  <div className="mt-2 font-display text-4xl">
                    <span className="gold-text-gradient">{teamProgress}%</span>
                  </div>
                </div>
                <Trophy className="h-8 w-8 text-gold" />
              </div>
              <Progress value={teamProgress} className="mt-5 h-2 bg-secondary [&>div]:bg-gold-gradient" />
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/60 pt-5">
                <div>
                  <div className="text-xs text-muted-foreground">Выручка</div>
                  <div className="font-display text-lg">{formatCurrency(teamStats.revenue)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Цель</div>
                  <div className="font-display text-lg text-muted-foreground">{formatCurrency(teamStats.target)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Закрыто сделок", value: formatNumber(teamStats.deals), icon: Target, delta: "+18%" },
              { label: "Средний чек", value: formatCurrency(teamStats.avgCheck), icon: TrendingUp, delta: "+6.2%" },
              { label: "Конверсия", value: `${teamStats.conversion}%`, icon: Zap, delta: "+3.1 п.п." },
              { label: "Активных менеджеров", value: teamStats.activeReps, icon: Users, delta: "+2" },
            ].map((kpi) => (
              <div key={kpi.label} className="group rounded-xl border border-border bg-card/80 p-5 transition-all hover:border-gold/40 hover:shadow-gold">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{kpi.label}</div>
                  <kpi.icon className="h-4 w-4 text-gold" />
                </div>
                <div className="mt-3 font-display text-3xl">{kpi.value}</div>
                <div className="mt-1 text-xs text-success">{kpi.delta} к прошлому кварталу</div>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section id="leaderboard" className="container py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold">Лидерборд</div>
              <h2 className="mt-2 font-display text-4xl">Чемпионы квартала</h2>
            </div>
            <div className="hidden text-sm text-muted-foreground md:block">
              Обновлено 2 минуты назад
            </div>
          </div>

          {/* Podium */}
          <div className="mb-10 grid gap-4 md:grid-cols-3">
            {sortedReps.slice(0, 3).map((rep, i) => {
              const place = i + 1;
              const accent = place === 1 ? "border-gold/60 shadow-gold" : place === 2 ? "border-border" : "border-border";
              return (
                <div key={rep.id} className={`relative overflow-hidden rounded-2xl border ${accent} bg-card p-6 ${place === 1 ? "md:-translate-y-3" : ""}`}>
                  {place === 1 && <div className="absolute inset-x-0 top-0 h-px shimmer" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold ${place === 1 ? "bg-gold-gradient text-primary-foreground" : "bg-secondary text-foreground"}`}>
                        {rep.initials}
                      </div>
                      <div>
                        <div className="font-medium">{rep.name}</div>
                        <div className="text-xs text-muted-foreground">{rep.team} · Lv {rep.level}</div>
                      </div>
                    </div>
                    <Medal className={`h-6 w-6 ${place === 1 ? "text-gold" : place === 2 ? "text-muted-foreground" : "text-muted-foreground/70"}`} />
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Очки</div>
                      <div className="font-display text-3xl gold-text-gradient">{formatNumber(rep.points)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Выручка</div>
                      <div className="font-display text-lg">{formatCurrency(rep.revenue)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Flame className="h-3 w-3 text-gold" /> серия {rep.streak} дней
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card/60">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Менеджер</th>
                  <th className="px-6 py-4 text-left">Команда</th>
                  <th className="px-6 py-4 text-right">Выручка</th>
                  <th className="px-6 py-4 text-right">План</th>
                  <th className="px-6 py-4 text-right">Очки</th>
                </tr>
              </thead>
              <tbody>
                {sortedReps.map((rep, i) => {
                  const planPct = Math.round((rep.revenue / rep.target) * 100);
                  return (
                    <tr key={rep.id} className="border-t border-border/60 transition-colors hover:bg-secondary/40">
                      <td className="px-6 py-4 font-display text-lg text-gold">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">{rep.initials}</div>
                          <div>
                            <div className="font-medium">{rep.name}</div>
                            <div className="text-xs text-muted-foreground">{rep.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{rep.team}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(rep.revenue)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full bg-gold-gradient" style={{ width: `${Math.min(planPct, 100)}%` }} />
                          </div>
                          <span className={`w-12 text-right ${planPct >= 100 ? "text-success" : "text-muted-foreground"}`}>{planPct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-display text-base gold-text-gradient">{formatNumber(rep.points)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Contests */}
        <section id="contests" className="container py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold">Конкурсы</div>
              <h2 className="mt-2 font-display text-4xl">Активные челленджи</h2>
            </div>
            <Button variant="outline" className="border-gold/40 bg-transparent text-gold hover:bg-secondary hover:text-gold-light">
              Все конкурсы
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {contests.map((c) => (
              <div key={c.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-gold/40 hover:shadow-elegant">
                <div className="flex items-start justify-between">
                  <Award className="h-7 w-7 text-gold" />
                  <Badge variant="outline" className="border-gold/30 text-xs text-gold">
                    <Clock className="mr-1 h-3 w-3" /> {c.endsAt}
                  </Badge>
                </div>
                <h3 className="mt-5 font-display text-2xl">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Прогресс лидера</span>
                    <span className="text-gold">{c.progress}%</span>
                  </div>
                  <Progress value={c.progress} className="h-1.5 bg-secondary [&>div]:bg-gold-gradient" />
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">Лидер</div>
                    <div className="mt-0.5 font-medium">{c.leader}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Участники</div>
                    <div className="mt-0.5 font-medium">{c.participants}</div>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-gold/20 bg-secondary/40 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Приз</div>
                  <div className="mt-1 text-sm font-medium gold-text-gradient">{c.prize}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity + badges */}
        <section id="activity" className="container grid gap-6 py-14 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card/80">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
              <div>
                <div className="text-xs uppercase tracking-widest text-gold">Лента активности</div>
                <h3 className="mt-1 font-display text-2xl">Свежие сделки</h3>
              </div>
              <TrendingUp className="h-5 w-5 text-gold" />
            </div>
            <ul className="divide-y divide-border/60">
              {recentDeals.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/40">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${d.status === "won" ? "bg-success" : d.status === "negotiation" ? "bg-gold" : "bg-muted-foreground"}`} />
                    <div>
                      <div className="text-sm font-medium">{d.client}</div>
                      <div className="text-xs text-muted-foreground">{d.rep} · {d.closedAt}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-base">{formatCurrency(d.amount)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {d.status === "won" ? "закрыто" : d.status === "negotiation" ? "переговоры" : "в работе"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-card p-6 shadow-elegant">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-gradient text-primary-foreground font-semibold">
                {top.initials}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-gold">Игрок дня</div>
                <div className="font-display text-xl">{top.name}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-y border-border/60 py-4 text-center">
              <div>
                <div className="font-display text-2xl gold-text-gradient">Lv {top.level}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">уровень</div>
              </div>
              <div>
                <div className="font-display text-2xl">{top.streak}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">дней подряд</div>
              </div>
              <div>
                <div className="font-display text-2xl">{top.deals}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">сделок</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Награды</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {top.badges.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-secondary/60 px-3 py-1 text-xs text-gold-light">
                    <Sparkles className="h-3 w-3" /> {b}
                  </span>
                ))}
              </div>
            </div>

            <Button className="mt-6 w-full bg-gold-gradient text-primary-foreground shadow-gold hover:opacity-90">
              Открыть профиль
            </Button>
          </div>
        </section>

        <footer className="border-t border-border/60">
          <div className="container flex flex-col items-center justify-between gap-3 py-8 text-xs text-muted-foreground md:flex-row">
            <div>© 2026 Apex Sales Motivation · Демо-данные</div>
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3 text-gold" /> Premium edition
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
