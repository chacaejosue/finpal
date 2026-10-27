"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { workspaceSchema } from "@/lib/validations/workspace";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";
import { isValidUuid } from "@/lib/security";

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

  const rl = await checkRateLimit({
    action: "mutation:workspace",
    limit: 10,
    windowMs: 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) return { error: { _global: [rl.message!] } };

  const { count } = await supabase
    .from("espacios_trabajo")
    .select("id", { count: "exact", head: true })
    .eq("propietario_id", user.id);

  if ((count ?? 0) >= QUOTAS.MAX_WORKSPACES_PER_USER) {
    return {
      error: {
        _global: [
          `Has alcanzado el límite máximo de ${QUOTAS.MAX_WORKSPACES_PER_USER} espacios de trabajo por cuenta.`,
        ],
      },
    };
  }

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
  if (!isValidUuid(espacioId)) return { error: "Identificador de espacio no válido" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("espacios_trabajo")
    .delete()
    .eq("id", espacioId)
    .eq("propietario_id", user.id);

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

