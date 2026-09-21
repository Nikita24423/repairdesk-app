"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { FormMessage, fieldClass, btnPrimary } from "@/components/ui";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label className="mb-1 block text-sm text-slate-600">Email</label>
        <input
          name="email"
          type="email"
          required
          className={fieldClass}
          placeholder="admin@demo.local"
          autoComplete="username"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Пароль</label>
        <input
          name="password"
          type="password"
          required
          className={fieldClass}
          placeholder="demo1234"
          autoComplete="current-password"
        />
      </div>
      <FormMessage error={state?.error} />
      <button type="submit" className={`${btnPrimary} w-full`} disabled={pending}>
        {pending ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
