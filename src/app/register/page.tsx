import Link from "next/link";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { AuthShell } from "@/components/auth-shell";
import { isRegistrationEnabled } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  // Без заданного кода приглашения страницы регистрации просто нет.
  if (!(await isRegistrationEnabled())) notFound();

  return (
    <AuthShell
      title="Регистрация"
      footer={
        <>
          Уже есть учётная запись?{" "}
          <Link href="/login" className="font-medium text-teal-800 hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
