import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  );
}
