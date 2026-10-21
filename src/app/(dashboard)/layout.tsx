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

  let espaciosDisponibles: { id: string; nombre: string; zona_horaria?: string }[] = [];
  try {
    const { data: rawEspacios } = await supabase
      .from("espacios_trabajo")
      .select("id, nombre, zona_horaria")
      .order("created_at", { ascending: true });

    if (rawEspacios) {
      espaciosDisponibles = rawEspacios.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        zona_horaria: e.zona_horaria ?? "America/La_Paz",
      }));
    }
  } catch {
    // Si falla la consulta, mantenemos array vacío
  }

  return (
    <DashboardProvider userEmail={user.email ?? ""}>
      <DashboardShell userEmail={user.email ?? ""} espaciosDisponibles={espaciosDisponibles}>
        {children}
      </DashboardShell>
    </DashboardProvider>
  );
}

