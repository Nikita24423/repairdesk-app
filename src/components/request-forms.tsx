"use client";

import { useActionState } from "react";
import {
  createRequestAction,
  updateRequestAction,
  updateRequestStatusAction,
} from "@/lib/actions/requests";
import type { Equipment, Priority, RequestStatus, User } from "@/db/schema";
import {
  FormMessage,
  fieldClass,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";
import { priorityLabels, statusLabels } from "@/lib/metrics";

type Master = Pick<User, "id" | "name" | "email" | "role">;

export function CreateRequestForm({
  equipmentList,
  masters,
}: {
  equipmentList: Equipment[];
  masters: Master[];
}) {
  const [state, formAction, pending] = useActionState(
    createRequestAction,
    undefined
  );

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm text-slate-600">Заголовок</label>
        <input name="title" required className={fieldClass} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm text-slate-600">Описание</label>
        <textarea name="description" required rows={3} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Оборудование</label>
        <select name="equipmentId" required className={fieldClass}>
          <option value="">Выберите…</option>
          {equipmentList.map((e) => (
            <option key={e.id} value={e.id}>
              {e.inventoryCode} — {e.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Приоритет</label>
        <select name="priority" defaultValue="medium" className={fieldClass}>
          {(Object.keys(priorityLabels) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {priorityLabels[p]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">SLA, часов</label>
        <input
          name="slaHours"
          type="number"
          defaultValue={48}
          min={1}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Мастер</label>
        <select name="assigneeId" className={fieldClass} defaultValue="">
          <option value="">Не назначен</option>
          {masters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Создание…" : "Создать заявку"}
        </button>
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  );
}

export function EditRequestForm({
  requestId,
  defaults,
  equipmentList,
  masters,
  canEditFields,
}: {
  requestId: string;
  defaults: {
    title: string;
    description: string;
    equipmentId: string;
    priority: Priority;
    slaHours: number;
    assigneeId: string | null;
  };
  equipmentList: Equipment[];
  masters: Master[];
  canEditFields: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateRequestAction,
    undefined
  );

  if (!canEditFields) return null;

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="id" value={requestId} />
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm text-slate-600">Заголовок</label>
        <input
          name="title"
          required
          defaultValue={defaults.title}
          className={fieldClass}
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm text-slate-600">Описание</label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={defaults.description}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Оборудование</label>
        <select
          name="equipmentId"
          required
          defaultValue={defaults.equipmentId}
          className={fieldClass}
        >
          {equipmentList.map((e) => (
            <option key={e.id} value={e.id}>
              {e.inventoryCode} — {e.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Приоритет</label>
        <select
          name="priority"
          defaultValue={defaults.priority}
          className={fieldClass}
        >
          {(Object.keys(priorityLabels) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {priorityLabels[p]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">SLA, часов</label>
        <input
          name="slaHours"
          type="number"
          defaultValue={defaults.slaHours}
          min={1}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Мастер</label>
        <select
          name="assigneeId"
          defaultValue={defaults.assigneeId ?? ""}
          className={fieldClass}
        >
          <option value="">Не назначен</option>
          {masters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </button>
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  );
}

export function StatusUpdateForm({
  requestId,
  currentStatus,
  workComment,
  masters,
  canAssign,
  isMaster,
}: {
  requestId: string;
  currentStatus: RequestStatus;
  workComment: string | null;
  masters: Master[];
  canAssign: boolean;
  isMaster: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateRequestStatusAction,
    undefined
  );

  const statuses: RequestStatus[] = isMaster
    ? ["assigned", "in_progress", "done"]
    : ["new", "assigned", "in_progress", "done", "cancelled"];

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={requestId} />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Статус</label>
          <select
            name="status"
            defaultValue={currentStatus}
            className={fieldClass}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>
        {canAssign ? (
          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Назначить мастера
            </label>
            <select name="assigneeId" className={fieldClass} defaultValue="">
              <option value="">Не менять</option>
              {masters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">
          Комментарий о работах
        </label>
        <textarea
          name="workComment"
          rows={3}
          defaultValue={workComment ?? ""}
          className={fieldClass}
          placeholder="Что сделано / причина задержки"
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className={btnSecondary} disabled={pending}>
          {pending ? "Обновление…" : "Обновить статус"}
        </button>
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  );
}
