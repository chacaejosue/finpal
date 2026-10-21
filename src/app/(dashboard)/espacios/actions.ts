"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { workspaceSchema } from "@/lib/validations/workspace";

// ── Listar espacios del usuario autenticado ───────────────────────────────
export async function getEspacios() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { data, error } = await supabase
    .from("espacios_trabajo")
    .select(`
      id, nombre, codigo_moneda, zona_horaria, created_at,
      miembros_espacio(rol),
      contactos(count),
      prestamos(count)
    `)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Crear un nuevo espacio de trabajo ────────────────────────────────────
export async function crearEspacio(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    currencyCode: formData.get("currencyCode") ?? "BOB",
    timezone: formData.get("timezone") ?? "America/La_Paz",
  };

  const parsed = workspaceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase.from("espacios_trabajo").insert({
    nombre: parsed.data.name,
    codigo_moneda: parsed.data.currencyCode,
    zona_horaria: parsed.data.timezone,
    propietario_id: user.id,
  });

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/espacios");
  return { success: true };
}

// ── Eliminar un espacio (solo el propietario puede hacerlo) ──────────────
export async function eliminarEspacio(espacioId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("espacios_trabajo")
    .delete()
    .eq("id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/espacios");
  return { success: true };
}

// ── Actualizar zona horaria del espacio de trabajo ────────────────────────
export async function actualizarZonaHorariaEspacio(espacioId: string, zonaHoraria: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("espacios_trabajo")
    .update({ zona_horaria: zonaHoraria })
    .eq("id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/configuracion");
  revalidatePath("/inicio");
  revalidatePath("/espacios");
  return { success: true };
}

