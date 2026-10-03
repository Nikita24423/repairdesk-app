"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn, signOut } from "@/lib/auth";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
  redirect("/login");
}

/**
 * Самостоятельная регистрация закрыта кодом приглашения: в системах учёта
 * ремонтов учётки раздаёт предприятие, а не открытый интернет. Код задаётся
 * через REGISTRATION_CODE; пока переменная не выставлена, регистрации нет.
 */
export async function isRegistrationEnabled() {
  return Boolean(process.env.REGISTRATION_CODE);
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Укажите имя полностью"),
    email: z.email("Некорректный email"),
    password: z.string().min(8, "Пароль не короче 8 символов"),
    confirm: z.string(),
    inviteCode: z.string().min(1, "Введите код приглашения"),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Пароли не совпадают",
  });

export type RegisterState = {
  error?: string;
  /** Введённые значения возвращаются в форму, чтобы не набирать всё заново. */
  values?: { name: string; email: string };
};

export async function registerAction(
  _prev: RegisterState | undefined,
  formData: FormData
): Promise<RegisterState | undefined> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };

  const expectedCode = process.env.REGISTRATION_CODE;
  if (!expectedCode) {
    return { error: "Регистрация отключена. Обратитесь к администратору." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверьте поля формы",
      values,
    };
  }

  if (parsed.data.inviteCode.trim() !== expectedCode) {
    return { error: "Неверный код приглашения", values };
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    // Роль по умолчанию — master; повысить её может только администратор.
    await db.insert(users).values({
      name: parsed.data.name,
      email,
      passwordHash,
      role: "master",
    });
  } catch {
    return { error: "Пользователь с таким email уже существует", values };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }
}
