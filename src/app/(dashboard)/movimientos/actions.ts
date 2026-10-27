"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transaccionSchema } from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";
import { encryptFieldSync, decryptFieldSync, isEncrypted, autoMigrateRow } from "@/lib/crypto";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";

// ── Listar transacciones del espacio ──────────────────────────────────────
export async function getMovimientos(espacioId: string, limit = 200) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const safeLimit = Math.min(Math.max(1, limit), 1000);

  const { data, error } = await supabase
    .from("transacciones")
    .select(`
      id, tipo, ajuste_sentido, monto, ocurrido_en, descripcion, created_at,
      cuentas_dinero(id, nombre),
      categorias(id, nombre)
    `)
    .eq("espacio_id", espacioId)
    .order("ocurrido_en", { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((m) => {
    // Auto-migración silenciosa y descifrado de la descripción
    if (m.descripcion && !isEncrypted(m.descripcion)) {
      autoMigrateRow(supabase, "transacciones", m.id, { descripcion: m.descripcion });
    }

    return {
      ...m,
      descripcion: decryptFieldSync(m.descripcion),
    };
  });
}

// ── Registrar movimiento (ingreso / gasto / ajuste) ───────────────────────
export async function registrarMovimiento(espacioId: string, formData: FormData) {
  if (!isValidUuid(espacioId)) return { error: { _global: ["Espacio no válido"] } };

  const parsed = transaccionSchema.safeParse({
    cuenta_dinero_id: formData.get("cuenta_dinero_id"),
    tipo: formData.get("tipo"),
    ajuste_sentido: formData.get("ajuste_sentido") || null,
    monto: formData.get("monto"),
    ocurrido_en: formData.get("ocurrido_en"),
    descripcion: sanitizeText(formData.get("descripcion"), 500),
    categoria_id: formData.get("categoria_id") || null,
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const rl = await checkRateLimit({
    action: "mutation:movimiento",
    limit: 30,
    windowMs: 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) return { error: { _global: [rl.message!] } };

  const { count } = await supabase
    .from("transacciones")
    .select("id", { count: "exact", head: true })
    .eq("espacio_id", espacioId);

  if ((count ?? 0) >= QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE) {
    return {
      error: {
        _global: [
          `Has alcanzado el límite de ${QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE} transacciones en este espacio.`,
        ],
      },
    };
  }

  const { error } = await supabase.from("transacciones").insert({
    espacio_id: espacioId,
    cuenta_dinero_id: parsed.data.cuenta_dinero_id,
    tipo: parsed.data.tipo,
    ajuste_sentido: parsed.data.ajuste_sentido,
    monto: parsed.data.monto,
    ocurrido_en: parsed.data.ocurrido_en,
    descripcion: encryptFieldSync(parsed.data.descripcion) || null,
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
  if (!isValidUuid(txId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

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
