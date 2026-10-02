import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/db";
import { equipment } from "@/db/schema";
import type { Priority, RequestStatus } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  getMasterUsers,
  getRequests,
} from "@/lib/actions/requests";
import { canCreateRequest } from "@/lib/permissions";
import {
  priorityColors,
  priorityLabels,
  statusColors,
  statusLabels,
} from "@/lib/metrics";
import { Badge, Card, PageHeader, fieldClass } from "@/components/ui";
import { CreateRequestForm } from "@/components/request-forms";

export const dynamic = "force-dynamic";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    assigneeId?: string;
    workshop?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  const isMaster = session.user.role === "master";

  const [rows, masters, equipmentList] = await Promise.all([
    getRequests({
      status: (params.status as RequestStatus) || "",
      priority: (params.priority as Priority) || "",
      assigneeId: params.assigneeId || "",
      workshop: params.workshop || "",
      from: params.from,
      to: params.to,
      forMasterId: isMaster ? session.user.id : undefined,
    }),
    getMasterUsers(),
    db.select().from(equipment).orderBy(equipment.name),
  ]);

  const workshops = Array.from(
    new Set(equipmentList.map((e) => e.workshop))
  ).sort();

  return (
    <div>
      <PageHeader
        title={isMaster ? "Мои заявки" : "Заявки на ремонт"}
        description="Учёт, фильтры и управление статусами"
      />

      <Card className="mb-6">
        <form className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Статус</label>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className={fieldClass}
            >
              <option value="">Все</option>
              {(Object.keys(statusLabels) as RequestStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Приоритет</label>
            <select
              name="priority"
              defaultValue={params.priority ?? ""}
              className={fieldClass}
            >
              <option value="">Все</option>
              {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {priorityLabels[p]}
                </option>
              ))}
            </select>
          </div>
          {!isMaster ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Мастер</label>
              <select
                name="assigneeId"
                defaultValue={params.assigneeId ?? ""}
                className={fieldClass}
              >
                <option value="">Все</option>
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs text-slate-500">Цех</label>
            <select
              name="workshop"
              defaultValue={params.workshop ?? ""}
              className={fieldClass}
            >
              <option value="">Все</option>
              {workshops.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">С</label>
            <input
              type="date"
              name="from"
              defaultValue={params.from}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">По</label>
            <input
              type="date"
              name="to"
              defaultValue={params.to}
              className={fieldClass}
            />
          </div>
          <div className="flex items-end md:col-span-3 lg:col-span-6">
            <button
              type="submit"
              className="rounded-md bg-teal-800 px-4 py-2 text-sm text-white"
            >
              Фильтровать
            </button>
          </div>
        </form>
      </Card>

      {canCreateRequest(session.user.role) ? (
        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Новая заявка</h2>
          <CreateRequestForm equipmentList={equipmentList} masters={masters} />
        </Card>
      ) : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Заявка</th>
                <th className="px-2 py-2">Цех / оборудование</th>
                <th className="px-2 py-2">Приоритет</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Мастер</th>
                <th className="px-2 py-2">SLA</th>
                <th className="px-2 py-2">Дата</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
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
                    <div>{row.equipment.workshop}</div>
                    <div className="text-xs text-slate-400">
                      {row.equipment.inventoryCode} · {row.equipment.name}
                    </div>
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
                    {row.assignee?.name ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    {row.request.slaHours} ч
                  </td>
                  <td className="px-2 py-2 text-slate-500">
                    {format(row.request.createdAt, "d MMM yyyy HH:mm", {
                      locale: ru,
                    })}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-8 text-center text-slate-500"
                  >
                    Заявки не найдены
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
