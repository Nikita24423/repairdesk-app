import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/db";
import { repairRequests, equipment, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  computeKpis,
  filterByPeriod,
  formatHours,
  formatPercent,
  priorityColors,
  priorityLabels,
  statusColors,
  statusLabels,
} from "@/lib/metrics";
import { Badge, Card, KpiCard, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
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
    .leftJoin(users, eq(repairRequests.assigneeId, users.id))
    .orderBy(desc(repairRequests.createdAt));

  let scoped = rows;
  if (session?.user.role === "master") {
    scoped = rows.filter((r) => r.request.assigneeId === session.user.id);
  }

  const periodFiltered = filterByPeriod(
    scoped.map((r) => r.request),
    from,
    to
  );
  const kpis = computeKpis(periodFiltered);
  const recent = scoped.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Дашборд эффективности"
        description="Ключевые показатели выполнения заявок на ремонт"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Соблюдение SLA"
          value={formatPercent(kpis.slaCompliance)}
          hint={`по ${kpis.done} выполненным`}
        />
        <KpiCard
          label="MTTR"
          value={formatHours(kpis.mttr)}
          hint="среднее время ремонта"
        />
        <KpiCard
          label="Backlog"
          value={String(kpis.backlog)}
          hint="открытые заявки"
        />
        <KpiCard
          label="Доля выполненных"
          value={formatPercent(kpis.completionRate)}
          hint={`${kpis.done} из ${kpis.total}`}
        />
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Последние заявки
          </h2>
          <Link href="/requests" className="text-sm text-teal-800 hover:underline">
            Все заявки
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Заявка</th>
                <th className="px-2 py-2">Оборудование</th>
                <th className="px-2 py-2">Приоритет</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Мастер</th>
                <th className="px-2 py-2">Создана</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr
                  key={row.request.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-2 py-2">
                    <Link
                      href={`/requests/${row.request.id}`}
                      className="font-medium text-teal-900 hover:underline"
                    >
                      {row.request.title}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    {row.equipment.name}
                  </td>
                  <td className="px-2 py-2">
                    <Badge className={priorityColors[row.request.priority]}>
                      {priorityLabels[row.request.priority]}
                    </Badge>
                  </td>
                  <td className="px-2 py-2">
                    <Badge className={statusColors[row.request.status]}>
                      {statusLabels[row.request.status]}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    {row.assigneeName ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-slate-500">
                    {format(row.request.createdAt, "d MMM yyyy", { locale: ru })}
                  </td>
                </tr>
              ))}
              {recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-2 py-8 text-center text-slate-500"
                  >
                    Нет заявок за выбранный период
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
