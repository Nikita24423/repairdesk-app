import { desc } from "drizzle-orm";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { roleLabel } from "@/lib/permissions";
import { Card, PageHeader } from "@/components/ui";
import { CreateUserForm, UserRoleForm } from "@/components/user-forms";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) return null;

  const list = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div>
      <PageHeader
        title="Пользователи"
        description="Управление учётными записями и ролями"
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Новый пользователь</h2>
        <CreateUserForm />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Имя</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Роль</th>
                <th className="px-2 py-2">Создан</th>
                <th className="px-2 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-2 py-2 font-medium">{user.name}</td>
                  <td className="px-2 py-2 text-slate-600">{user.email}</td>
                  <td className="px-2 py-2">{roleLabel(user.role)}</td>
                  <td className="px-2 py-2 text-slate-500">
                    {format(user.createdAt, "d MMM yyyy", { locale: ru })}
                  </td>
                  <td className="px-2 py-2">
                    <UserRoleForm
                      user={user}
                      currentUserId={session.user.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
