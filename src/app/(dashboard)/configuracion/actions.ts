"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
