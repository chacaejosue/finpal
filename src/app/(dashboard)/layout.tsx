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

  let espaciosDisponibles: { id: string; nombre: string; zona_horaria?: string; codigo_moneda?: string }[] = [];
  let userColorAcento = "verde";
  try {
    const [rawEspacios, rawPerfil] = await Promise.all([
      supabase
        .from("espacios_trabajo")
        .select("id, nombre, zona_horaria, codigo_moneda")
        .order("created_at", { ascending: true }),
      supabase
        .from("perfiles")
        .select("color_acento")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (rawEspacios.data) {
      espaciosDisponibles = rawEspacios.data.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        zona_horaria: e.zona_horaria ?? "America/La_Paz",
        codigo_moneda: e.codigo_moneda ?? "BOB",
      }));
    }
    if (rawPerfil.data?.color_acento) {
      userColorAcento = rawPerfil.data.color_acento;
    }
  } catch {
    // Si falla la consulta, mantenemos defaults
  }

  return (
    <DashboardProvider userEmail={user.email ?? ""} initialColorAcento={userColorAcento}>
      <DashboardShell userEmail={user.email ?? ""} espaciosDisponibles={espaciosDisponibles}>
        {children}
      </DashboardShell>
    </DashboardProvider>
  );
}
