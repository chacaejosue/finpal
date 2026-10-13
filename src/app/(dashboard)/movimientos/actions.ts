"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transaccionSchema } from "@/lib/validations/schemas";

// ── Listar transacciones del espacio ──────────────────────────────────────
export async function getMovimientos(espacioId: string, limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transacciones")
    .select(`
      id, tipo, ajuste_sentido, monto, ocurrido_en, descripcion, created_at,
      cuentas_dinero(id, nombre),
      categorias(id, nombre)
    `)
    .eq("espacio_id", espacioId)
    .order("ocurrido_en", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Registrar movimiento (ingreso / gasto / ajuste) ───────────────────────
export async function registrarMovimiento(espacioId: string, formData: FormData) {
  const parsed = transaccionSchema.safeParse({
    cuenta_dinero_id: formData.get("cuenta_dinero_id"),
    tipo: formData.get("tipo"),
    ajuste_sentido: formData.get("ajuste_sentido") || null,
    monto: formData.get("monto"),
    ocurrido_en: formData.get("ocurrido_en"),
    descripcion: formData.get("descripcion"),
    categoria_id: formData.get("categoria_id") || null,
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase.from("transacciones").insert({
    espacio_id: espacioId,
    cuenta_dinero_id: parsed.data.cuenta_dinero_id,
    tipo: parsed.data.tipo,
    ajuste_sentido: parsed.data.ajuste_sentido,
    monto: parsed.data.monto,
    ocurrido_en: parsed.data.ocurrido_en,
    descripcion: parsed.data.descripcion,
    categoria_id: parsed.data.categoria_id,
  });

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/inicio");
  return { success: true };
}

// ── Eliminar movimiento ───────────────────────────────────────────────────
export async function eliminarMovimiento(txId: string, espacioId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transacciones")
    .delete()
    .eq("id", txId)
    .eq("espacio_id", espacioId)
    // Solo borrar movimientos manuales, no los generados por préstamos
    .is("prestamo_id", null);

  if (error) return { error: error.message };

  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/inicio");
  return { success: true };
}
