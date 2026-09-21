"use client";

import { useActionState } from "react";
import {
  createUserAction,
  updateUserRoleAction,
  deleteUserAction,
} from "@/lib/actions/users";
import type { User, UserRole } from "@/db/schema";
import { roleLabel } from "@/lib/permissions";
import {
  FormMessage,
  fieldClass,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, undefined);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm text-slate-600">Имя</label>
        <input name="name" required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Email</label>
        <input name="email" type="email" required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Пароль</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Роль</label>
        <select name="role" defaultValue="master" className={fieldClass}>
          {(["admin", "dispatcher", "master"] as UserRole[]).map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Создание…" : "Создать пользователя"}
        </button>
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  );
}

export function UserRoleForm({
  user,
  currentUserId,
}: {
  user: User;
  currentUserId: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={updateUserRoleAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={user.id} />
        <select
          name="role"
          defaultValue={user.role}
          className={fieldClass}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          {(["admin", "dispatcher", "master"] as UserRole[]).map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </form>
      {user.id !== currentUserId ? (
        <form action={deleteUserAction}>
          <input type="hidden" name="id" value={user.id} />
          <button type="submit" className={`${btnSecondary} text-rose-700`}>
            Удалить
          </button>
        </form>
      ) : null}
    </div>
  );
}
