import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EspaciosClient from "./espacios-client";

export default async function EspaciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/iniciar-sesion");

  const [espaciosRes, perfilRes] = await Promise.all([
    supabase
      .from("espacios_trabajo")
      .select(
        `id, nombre, codigo_moneda, created_at,
         contactos(count),
         prestamos(count)`
      )
      .order("created_at", { ascending: true }),
    supabase
      .from("perfiles")
      .select("color_acento")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return (
    <EspaciosClient
      espacios={espaciosRes.data ?? []}
      userEmail={user.email ?? ""}
      initialColorAcento={perfilRes.data?.color_acento ?? "verde"}
    />
  );
}
