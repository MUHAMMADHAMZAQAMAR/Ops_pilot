import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: string;
  statusVariant?: "default" | "success" | "warning" | "critical";
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  statusVariant = "default",
}: MetricCardProps) {
  const variantStyles = {
    default: "text-zinc-100",
    success: "text-emerald-400",
    warning: "text-amber-400",
    critical: "text-rose-400",
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-zinc-800 p-2 text-zinc-400">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tracking-tight", variantStyles[statusVariant])}>
          {value}
        </div>
        <p className="mt-1 text-xs text-zinc-400">{description}</p>
        {trend && (
          <p className="mt-2 text-[11px] font-mono text-emerald-400/90 flex items-center gap-1">
            <span>↑</span> {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

