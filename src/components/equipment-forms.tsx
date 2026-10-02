"use client";

import { useActionState } from "react";
import {
  createEquipmentAction,
  deleteEquipmentAction,
  updateEquipmentAction,
} from "@/lib/actions/equipment";
import {
  FormMessage,
  fieldClass,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";
import type { Equipment } from "@/db/schema";

export function CreateEquipmentForm() {
  const [state, formAction, pending] = useActionState(
    createEquipmentAction,
    undefined
  );

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm text-slate-600">Название</label>
        <input name="name" required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">
          Инвентарный номер
        </label>
        <input name="inventoryCode" required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Цех</label>
        <input name="workshop" required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Тип</label>
        <input name="type" required className={fieldClass} />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Добавление…" : "Добавить"}
        </button>
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  );
}

export function EquipmentRow({ item }: { item: Equipment }) {
  const formId = `eq-${item.id}`;
  const [state, formAction, pending] = useActionState(
    updateEquipmentAction,
    undefined
  );

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-2 py-2" colSpan={5}>
        <form id={formId} action={formAction} className="hidden">
          <input type="hidden" name="id" value={item.id} />
        </form>
        <div className="grid gap-2 md:grid-cols-5">
          <input
            form={formId}
            name="inventoryCode"
            defaultValue={item.inventoryCode}
            className={fieldClass}
            aria-label="Инвентарный номер"
          />
          <input
            form={formId}
            name="name"
            defaultValue={item.name}
            className={fieldClass}
            aria-label="Название"
          />
          <input
            form={formId}
            name="workshop"
            defaultValue={item.workshop}
            className={fieldClass}
            aria-label="Цех"
          />
          <input
            form={formId}
            name="type"
            defaultValue={item.type}
            className={fieldClass}
            aria-label="Тип"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              form={formId}
              type="submit"
              className={btnSecondary}
              disabled={pending}
            >
              {pending ? "Сохранение…" : "Сохранить"}
            </button>
            <form action={deleteEquipmentAction}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className={`${btnSecondary} text-rose-700`}>
                Удалить
              </button>
            </form>
          </div>
        </div>
        <div className="mt-2">
          <FormMessage error={state?.error} success={state?.success} />
        </div>
      </td>
    </tr>
  );
}
