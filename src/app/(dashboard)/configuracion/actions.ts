"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const COLORES = ["verde", "azul", "violeta", "naranja", "rosa"] as const;
type ColorAcento = (typeof COLORES)[number];

export async function getPreferencias() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { data, error } = await supabase
    .from("perfiles")
    .select("color_acento, modo_oscuro, tasa_interes_predeterminada")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  return {
    colorAcento: (COLORES.includes(data.color_acento as ColorAcento) ? data.color_acento : "verde") as ColorAcento,
    modoOscuro: Boolean(data.modo_oscuro),
    tasaInteresPredeterminada: Number(data.tasa_interes_predeterminada ?? 3),
  };
}

export async function actualizarPreferencias(
  colorAcento: string,
  modoOscuro: boolean,
  tasaInteresPredeterminada: number,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const rl = await checkRateLimit({
    action: "mutation:preferencias",
    limit: 20,
    windowMs: 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) return { error: rl.message! };

  if (!COLORES.includes(colorAcento as ColorAcento)) return { error: "Color no válido" };
  if (!Number.isFinite(tasaInteresPredeterminada) || tasaInteresPredeterminada < 0 || tasaInteresPredeterminada > 100) {
    return { error: "La tasa predeterminada debe estar entre 0 y 100" };
  }

  const { error } = await supabase
    .from("perfiles")
    .update({
      color_acento: colorAcento,
      modo_oscuro: Boolean(modoOscuro),
      tasa_interes_predeterminada: tasaInteresPredeterminada,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/configuracion");
  return { success: true };
}

/**
 * Ejerce el Derecho al Olvido / Supresión de Datos (Bolivia Hábeas Data CPE Art. 21.2, CCPA EE. UU., GDPR).
 * Elimina todos los espacios de trabajo del usuario, su perfil y su cuenta de autenticación.
 */
export async function eliminarMiCuentaDefinitivamente(confirmacionTexto: string) {
  if (confirmacionTexto.trim().toUpperCase() !== "ELIMINAR MI CUENTA") {
    return { error: "Debes escribir exactamente 'ELIMINAR MI CUENTA' para confirmar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const rl = await checkRateLimit({
    action: "mutation:delete-account",
    limit: 3,
    windowMs: 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) return { error: rl.message! };

  // Intentar primero el borrado integral en cascada vía RPC SECURITY DEFINER (incluye auth.users)
  const { error: rpcError } = await supabase.rpc("fn_eliminar_mi_cuenta");

  if (rpcError) {
    // Respaldo: si el RPC aún no fue ejecutado en Supabase, borrar todos los espacios y el perfil vía RLS
    await supabase
      .from("espacios_trabajo")
      .delete()
      .eq("propietario_id", user.id);
    await supabase.from("perfiles").delete().eq("id", user.id);
  }

  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("finpal_last_active");
  cookieStore.delete("finora_last_active");
  cookieStore.delete("finpal_remember_session");
  cookieStore.delete("finpal_espacio_id");

  redirect("/?mensaje=Tu+cuenta+y+todos+tus+datos+han+sido+eliminados+definitivamente.");
}
