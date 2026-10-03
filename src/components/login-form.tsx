"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { FormMessage, fieldClass, btnPrimary } from "@/components/ui";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label htmlFor="login-email" className="mb-1 block text-sm text-slate-600">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoFocus
          className={fieldClass}
          autoComplete="username"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1 block text-sm text-slate-600">
          Пароль
        </label>
        <PasswordInput name="password" autoComplete="current-password" />
      </div>
      <FormMessage error={state?.error} />
      <button type="submit" className={`${btnPrimary} w-full`} disabled={pending}>
        {pending ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
