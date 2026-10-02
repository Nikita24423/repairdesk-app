import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
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
        <h1 className="mb-4 text-lg font-semibold text-slate-900">Вход</h1>
        <LoginForm callbackUrl={callbackUrl} />
        <div className="mt-5 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
          <div className="font-medium text-slate-700">Демо-учётки</div>
          <p className="mt-1">Пароль для всех: <code>demo1234</code></p>
          <ul className="mt-2 space-y-0.5">
            <li>admin@demo.local</li>
            <li>dispatcher@demo.local</li>
            <li>master1@demo.local</li>
            <li>master2@demo.local</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
