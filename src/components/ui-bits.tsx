import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function Stat({
  label, value, hint, tone = "default", icon
}: {
  label: string; value: ReactNode; hint?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "accent";
  icon?: ReactNode;
}) {
  const toneCls = {
    default: "",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    accent: "text-accent",
  }[tone];
  const accentBar = {
    default: "bg-border",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    accent: "bg-accent",
  }[tone];
  return (
    <div className="relative bg-card rounded-lg border border-border p-4 lg:p-5 shadow-card overflow-hidden">
      <span className={cn("absolute left-0 top-0 bottom-0 w-0.5", accentBar, tone === "default" && "opacity-40")} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs lg:text-[13px] text-muted-foreground font-medium">{label}</div>
        {icon}
      </div>
      <div className={cn("font-display font-semibold text-xl lg:text-2xl mt-2 num text-foreground", toneCls)}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function Card({ children, className, title, subtitle, action }: {
  children: ReactNode; className?: string; title?: ReactNode; subtitle?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className={cn("bg-card rounded-lg border border-border shadow-card", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            {title && <h3 className="font-display text-base lg:text-lg font-semibold">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(title ? "px-5 pb-5" : "p-5")}>{children}</div>
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
      className
    )}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "success" | "warning" | "danger" | "gold" }) {
  const v = Math.max(0, Math.min(100, value));
  const bg = {
    accent: "bg-accent", success: "bg-success", warning: "bg-warning",
    danger: "bg-destructive", gold: "bg-gold",
  }[tone];
  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", bg)} style={{ width: `${v}%` }} />
    </div>
  );
}
