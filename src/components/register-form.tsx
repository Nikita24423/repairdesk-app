"use client";

import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { FormMessage, fieldClass, btnPrimary } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="reg-name" className="mb-1 block text-sm text-slate-600">
          Имя и фамилия
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          required
          minLength={2}
          autoFocus
          defaultValue={state?.values?.name ?? ""}
          className={fieldClass}
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="mb-1 block text-sm text-slate-600">
          Рабочий email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          defaultValue={state?.values?.email ?? ""}
          className={fieldClass}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="mb-1 block text-sm text-slate-600">
          Пароль
        </label>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          minLength={8}
        />
        <p className="mt-1 text-xs text-slate-400">Не короче 8 символов</p>
      </div>
      <div>
        <label htmlFor="reg-confirm" className="mb-1 block text-sm text-slate-600">
          Повторите пароль
        </label>
        <PasswordInput name="confirm" autoComplete="new-password" minLength={8} />
      </div>
      <div>
        <label htmlFor="reg-code" className="mb-1 block text-sm text-slate-600">
          Код приглашения
        </label>
        <input
          id="reg-code"
          name="inviteCode"
          type="text"
          required
          className={fieldClass}
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-slate-400">
          Выдаётся администратором предприятия
        </p>
      </div>
      <FormMessage error={state?.error} />
      <button type="submit" className={`${btnPrimary} w-full`} disabled={pending}>
        {pending ? "Создание учётной записи…" : "Зарегистрироваться"}
      </button>
    </form>
  );
}
