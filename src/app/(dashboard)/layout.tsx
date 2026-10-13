import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardProvider } from "@/lib/dashboard-context";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/iniciar-sesion");
  }

  return (
    <DashboardProvider userEmail={user.email ?? ""}>
      <DashboardShell userEmail={user.email ?? ""}>
        {children}
      </DashboardShell>
    </DashboardProvider>
  );
}
