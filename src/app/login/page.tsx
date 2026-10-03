import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { AuthShell } from "@/components/auth-shell";
import { isRegistrationEnabled } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";
  const canRegister = await isRegistrationEnabled();

  return (
    <AuthShell
      title="Вход"
      footer={
        canRegister ? (
          <>
            Нет учётной записи?{" "}
            <Link
              href="/register"
              className="font-medium text-teal-800 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </>
        ) : (
          "Учётные записи выдаёт администратор предприятия"
        )
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
