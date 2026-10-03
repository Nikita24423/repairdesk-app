"use client";

import { useState } from "react";
import { fieldClass } from "@/components/ui";

export function PasswordInput({
  name,
  autoComplete,
  minLength,
  placeholder,
}: {
  name: string;
  autoComplete: string;
  minLength?: number;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${fieldClass} pr-20`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 transition hover:text-slate-800"
        aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
      >
        {visible ? "Скрыть" : "Показать"}
      </button>
    </div>
  );
}
