"use client";

import { useActionState } from "react";
import {
  createEquipmentAction,
  deleteEquipmentAction,
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

export function EquipmentRowActions({ item }: { item: Equipment }) {
  return (
    <form action={deleteEquipmentAction}>
      <input type="hidden" name="id" value={item.id} />
      <button type="submit" className={`${btnSecondary} text-rose-700`}>
        Удалить
      </button>
    </form>
  );
}
