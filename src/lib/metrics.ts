import type { Priority, RequestStatus, RepairRequest } from "@/db/schema";

export const priorityLabels: Record<Priority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
};

export const statusLabels: Record<RequestStatus, string> = {
  new: "Новая",
  assigned: "Назначена",
  in_progress: "В работе",
  done: "Выполнена",
  cancelled: "Отменена",
};

export const priorityColors: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-sky-100 text-sky-800",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-rose-100 text-rose-800",
};

export const statusColors: Record<RequestStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  assigned: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-amber-100 text-amber-900",
  done: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-600",
};

export type RequestForMetrics = Pick<
  RepairRequest,
  | "status"
  | "slaHours"
  | "createdAt"
  | "startedAt"
  | "completedAt"
>;

function hoursBetween(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

export function isWithinSla(r: RequestForMetrics) {
  if (r.status !== "done" || !r.completedAt) return null;
  return hoursBetween(r.createdAt, r.completedAt) <= r.slaHours;
}

export function repairDurationHours(r: RequestForMetrics) {
  if (r.status !== "done" || !r.completedAt) return null;
  const start = r.startedAt ?? r.createdAt;
  return hoursBetween(start, r.completedAt);
}

export function filterByPeriod<T extends { createdAt: Date }>(
  items: T[],
  from?: Date | null,
  to?: Date | null
) {
  return items.filter((item) => {
    if (from && item.createdAt < from) return false;
    if (to && item.createdAt > to) return false;
    return true;
  });
}

export function computeKpis(requests: RequestForMetrics[]) {
  const done = requests.filter((r) => r.status === "done");
  const backlog = requests.filter(
    (r) => r.status !== "done" && r.status !== "cancelled"
  ).length;

  const slaChecked = done
    .map(isWithinSla)
    .filter((v): v is boolean => v !== null);
  const slaOk = slaChecked.filter(Boolean).length;
  const slaCompliance =
    slaChecked.length > 0 ? (slaOk / slaChecked.length) * 100 : 0;

  const durations = done
    .map(repairDurationHours)
    .filter((v): v is number => v !== null);
  const mttr =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  const created = requests.length;
  const completionRate = created > 0 ? (done.length / created) * 100 : 0;

  return {
    slaCompliance,
    mttr,
    backlog,
    completionRate,
    total: created,
    done: done.length,
  };
}

export function formatHours(hours: number) {
  if (!Number.isFinite(hours)) return "—";
  if (hours < 24) return `${hours.toFixed(1)} ч`;
  return `${(hours / 24).toFixed(1)} дн`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
