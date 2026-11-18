import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col">
      <PageHeader title={title} back />
      <div className="flex-1 space-y-5 p-5">{children}</div>
    </div>
  );
}
