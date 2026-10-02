"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["admin", "dispatcher", "master"]),
});

const updateRoleSchema = z.object({
  id: z.uuid(),
  role: z.enum(["admin", "dispatcher", "master"]),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    throw new Error("Недостаточно прав");
  }
  return session;
}

export async function createUserAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "Проверьте корректность полей" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await db.insert(users).values({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role,
    });
  } catch {
    return { error: "Пользователь с таким email уже существует" };
  }

  revalidatePath("/users");
  return { success: "Пользователь создан" };
}

export async function updateUserRoleAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateRoleSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new Error("Некорректные данные");
  }

  await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, parsed.data.id));

  revalidatePath("/users");
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id || id === session.user.id) {
    throw new Error("Нельзя удалить текущего пользователя");
  }

  try {
    await db.delete(users).where(eq(users.id, id));
  } catch {
    throw new Error(
      "Нельзя удалить пользователя, пока за ним числятся заявки"
    );
  }
  revalidatePath("/users");
}
