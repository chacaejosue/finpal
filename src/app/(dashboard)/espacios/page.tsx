import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EspaciosClient from "./espacios-client";

export default async function EspaciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/iniciar-sesion");

  const { data: espacios } = await supabase
    .from("espacios_trabajo")
    .select(
      `id, nombre, codigo_moneda, created_at,
       contactos(count),
       prestamos(count)`
    )
    .order("created_at", { ascending: true });

  return (
    <EspaciosClient
      espacios={espacios ?? []}
      userEmail={user.email ?? ""}
    />
  );
}
