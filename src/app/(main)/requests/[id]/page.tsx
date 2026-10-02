import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/db";
import { equipment } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  getMasterUsers,
  getRequestById,
  deleteRequestAction,
} from "@/lib/actions/requests";
import {
  canAssignRequest,
  canEditAnyRequest,
} from "@/lib/permissions";
import {
  isWithinSla,
  priorityColors,
  priorityLabels,
  repairDurationHours,
  statusColors,
  statusLabels,
  formatHours,
} from "@/lib/metrics";
import { Badge, Card, PageHeader, btnSecondary } from "@/components/ui";
import {
  EditRequestForm,
  StatusUpdateForm,
} from "@/components/request-forms";

export const dynamic = "force-dynamic";

function fmt(d: Date | null) {
  if (!d) return "—";
  return format(d, "d MMM yyyy HH:mm", { locale: ru });
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;
  const data = await getRequestById(id);
  if (!data) notFound();

  const isMaster = session.user.role === "master";
  if (isMaster && data.request.assigneeId !== session.user.id) {
    notFound();
  }

  const [masters, equipmentList] = await Promise.all([
    getMasterUsers(),
    db.select().from(equipment).orderBy(equipment.name),
  ]);

  const sla = isWithinSla(data.request);
  const duration = repairDurationHours(data.request);

  return (
    <div>
      <PageHeader
        title={data.request.title}
        description={`${data.equipment.inventoryCode} · ${data.equipment.name}`}
        actions={
          canEditAnyRequest(session.user.role) ? (
            <form action={deleteRequestAction}>
              <input type="hidden" name="id" value={data.request.id} />
              <button type="submit" className={`${btnSecondary} text-rose-700`}>
                Удалить
              </button>
            </form>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge className={statusColors[data.request.status]}>
          {statusLabels[data.request.status]}
        </Badge>
        <Badge className={priorityColors[data.request.priority]}>
          {priorityLabels[data.request.priority]}
        </Badge>
        {sla !== null ? (
          <Badge
            className={
              sla
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }
          >
            SLA: {sla ? "соблюдён" : "нарушен"}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Сведения</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Цех</dt>
              <dd>{data.equipment.workshop}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Тип оборудования</dt>
              <dd>{data.equipment.type}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Создал</dt>
              <dd>{data.createdBy.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Мастер</dt>
              <dd>{data.assignee?.name ?? "Не назначен"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">SLA</dt>
              <dd>{data.request.slaHours} ч</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Длительность</dt>
              <dd>{duration !== null ? formatHours(duration) : "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
            {data.request.description}
          </p>
          {data.request.workComment ? (
            <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
              <div className="mb-1 font-medium text-slate-700">
                Комментарий о работах
              </div>
              <p className="whitespace-pre-wrap text-slate-600">
                {data.request.workComment}
              </p>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Хронология</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Создана: {fmt(data.request.createdAt)}</li>
            <li>Назначена: {fmt(data.request.assignedAt)}</li>
            <li>В работе: {fmt(data.request.startedAt)}</li>
            <li>Завершена: {fmt(data.request.completedAt)}</li>
          </ul>
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="mb-3 font-medium">Обновить статус</h3>
            <StatusUpdateForm
              requestId={data.request.id}
              currentStatus={data.request.status}
              workComment={data.request.workComment}
              masters={masters}
              canAssign={canAssignRequest(session.user.role)}
              isMaster={isMaster}
            />
          </div>
        </Card>
      </div>

      {canEditAnyRequest(session.user.role) ? (
        <Card className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Редактирование</h2>
          <EditRequestForm
            requestId={data.request.id}
            canEditFields
            equipmentList={equipmentList}
            masters={masters}
            defaults={{
              title: data.request.title,
              description: data.request.description,
              equipmentId: data.request.equipmentId,
              priority: data.request.priority,
              slaHours: data.request.slaHours,
              assigneeId: data.request.assigneeId,
            }}
          />
        </Card>
      ) : null}
    </div>
  );
}
