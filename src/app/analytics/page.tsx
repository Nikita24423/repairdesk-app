import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repairRequests, equipment, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  computeKpis,
  filterByPeriod,
  formatHours,
  formatPercent,
  priorityLabels,
  statusLabels,
} from "@/lib/metrics";
import { Card, KpiCard, PageHeader } from "@/components/ui";
import {
  HorizontalBarChart,
  MonthlyLineChart,
  StatusPieChart,
} from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const from = params.from ? new Date(params.from) : null;
  const to = params.to ? new Date(params.to) : null;

  const rows = await db
    .select({
      request: repairRequests,
      equipment,
      assigneeName: users.name,
    })
    .from(repairRequests)
    .innerJoin(equipment, eq(repairRequests.equipmentId, equipment.id))
    .leftJoin(users, eq(repairRequests.assigneeId, users.id));

  let scoped = rows;
  if (session?.user.role === "master") {
    scoped = rows.filter((r) => r.request.assigneeId === session.user.id);
  }

  const filteredRequests = filterByPeriod(
    scoped.map((r) => r.request),
    from,
    to
  );
  const filteredRows = scoped.filter((r) =>
    filteredRequests.some((fr) => fr.id === r.request.id)
  );

  const kpis = computeKpis(filteredRequests);

  const statusData = Object.entries(statusLabels).map(([key, name]) => ({
    name,
    value: filteredRequests.filter((r) => r.status === key).length,
  })).filter((d) => d.value > 0);

  const priorityData = Object.entries(priorityLabels).map(([key, name]) => ({
    name,
    value: filteredRequests.filter((r) => r.priority === key).length,
  })).filter((d) => d.value > 0);

  const monthMap = new Map<string, { created: number; done: number }>();
  for (const r of filteredRequests) {
    const key = format(r.createdAt, "LLL yyyy", { locale: ru });
    const cur = monthMap.get(key) ?? { created: 0, done: 0 };
    cur.created += 1;
    if (r.status === "done") cur.done += 1;
    monthMap.set(key, cur);
  }
  const monthly = Array.from(monthMap.entries()).map(([month, v]) => ({
    month,
    ...v,
  }));

  const equipmentCount = new Map<string, number>();
  for (const row of filteredRows) {
    const name = row.equipment.name;
    equipmentCount.set(name, (equipmentCount.get(name) ?? 0) + 1);
  }
  const topEquipment = Array.from(equipmentCount.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const masterLoad = new Map<string, number>();
  for (const row of filteredRows) {
    if (!row.assigneeName) continue;
    if (row.request.status === "done" || row.request.status === "cancelled")
      continue;
    masterLoad.set(
      row.assigneeName,
      (masterLoad.get(row.assigneeName) ?? 0) + 1
    );
  }
  const masterData = Array.from(masterLoad.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const slaBreachEquipment = new Map<string, number>();
  for (const row of filteredRows) {
    if (row.request.status !== "done" || !row.request.completedAt) continue;
    const hours =
      (row.request.completedAt.getTime() - row.request.createdAt.getTime()) /
      (1000 * 60 * 60);
    if (hours > row.request.slaHours) {
      const name = row.equipment.name;
      slaBreachEquipment.set(name, (slaBreachEquipment.get(name) ?? 0) + 1);
    }
  }
  const slaBreaches = Array.from(slaBreachEquipment.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Аналитика"
        description="Динамика заявок, нагрузка мастеров и узкие места"
        actions={
          <form className="flex flex-wrap items-end gap-2 text-sm">
            <div>
              <label className="mb-1 block text-xs text-slate-500">С</label>
              <input
                type="date"
                name="from"
                defaultValue={params.from}
                className="rounded-md border border-slate-300 px-2 py-1.5"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">По</label>
              <input
                type="date"
                name="to"
                defaultValue={params.to}
                className="rounded-md border border-slate-300 px-2 py-1.5"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-teal-800 px-3 py-1.5 text-white"
            >
              Применить
            </button>
          </form>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="SLA" value={formatPercent(kpis.slaCompliance)} />
        <KpiCard label="MTTR" value={formatHours(kpis.mttr)} />
        <KpiCard label="Backlog" value={String(kpis.backlog)} />
        <KpiCard
          label="Выполнение"
          value={formatPercent(kpis.completionRate)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Динамика по месяцам</h2>
          <MonthlyLineChart data={monthly} />
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Распределение по статусам</h2>
          <StatusPieChart data={statusData} />
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">По приоритетам</h2>
          <StatusPieChart data={priorityData} />
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Нагрузка мастеров (открытые)</h2>
          <HorizontalBarChart data={masterData} valueLabel="Заявок" />
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Топ оборудования по заявкам</h2>
          <HorizontalBarChart data={topEquipment} valueLabel="Заявок" />
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Нарушения SLA по оборудованию</h2>
          <HorizontalBarChart data={slaBreaches} valueLabel="Нарушений" />
        </Card>
      </div>
    </div>
  );
}
