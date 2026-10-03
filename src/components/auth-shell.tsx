import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[90vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div
          className="text-3xl font-semibold tracking-tight text-slate-900"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          RepairDesk
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Система учёта и аналитики заявок на ремонт оборудования
        </p>
      </div>
      <Card>
        <h1 className="mb-4 text-lg font-semibold text-slate-900">{title}</h1>
        {children}
      </Card>
      {footer ? (
        <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>
      ) : null}
    </div>
  );
}
