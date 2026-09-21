import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { canManageEquipment, canManageUsers, roleLabel } from "@/lib/permissions";

const links = [
  { href: "/", label: "Дашборд" },
  { href: "/requests", label: "Заявки" },
  { href: "/analytics", label: "Аналитика" },
  { href: "/equipment", label: "Оборудование", roles: ["admin", "dispatcher"] as const },
  { href: "/users", label: "Пользователи", roles: ["admin"] as const },
];

export async function AppNav() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role;

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
            RepairDesk
          </Link>
          <nav className="flex flex-wrap gap-1">
            {links.map((link) => {
              if (link.href === "/users" && !canManageUsers(role)) return null;
              if (link.href === "/equipment" && !canManageEquipment(role))
                return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right">
            <div className="font-medium text-slate-800">{session.user.name}</div>
            <div className="text-xs text-slate-500">{roleLabel(role)}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-50"
            >
              Выйти
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
