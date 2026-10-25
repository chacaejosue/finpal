"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contactoSchema } from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";
import { encryptFieldSync, decryptFieldSync, isEncrypted, autoMigrateRow } from "@/lib/crypto";

// ── Listar contactos del espacio ──────────────────────────────────────────
export async function getContactos(espacioId: string) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("contactos")
    .select(`
      id, nombre, telefono, email, notas, archivado_en, created_at,
      prestamos(id, monto_principal, monto_capital_pagado, estado)
    `)
    .eq("espacio_id", espacioId)
    .is("archivado_en", null);

  if (error) throw new Error(error.message);

  const decrypted = (data ?? []).map((c) => {
    const isNombreLegacy = c.nombre && !isEncrypted(c.nombre);
    const isTelefonoLegacy = c.telefono && !isEncrypted(c.telefono);
    const isEmailLegacy = c.email && !isEncrypted(c.email);
    const isNotasLegacy = c.notas && !isEncrypted(c.notas);

    // Auto-migración silenciosa respetando RLS y la sesión del usuario
    if (isNombreLegacy || isTelefonoLegacy || isEmailLegacy || isNotasLegacy) {
      autoMigrateRow(supabase, "contactos", c.id, {
        ...(isNombreLegacy ? { nombre: c.nombre } : {}),
        ...(isTelefonoLegacy ? { telefono: c.telefono } : {}),
        ...(isEmailLegacy ? { email: c.email } : {}),
        ...(isNotasLegacy ? { notas: c.notas } : {}),
      });
    }

    return {
      ...c,
      nombre: decryptFieldSync(c.nombre) ?? "",
      telefono: decryptFieldSync(c.telefono) ?? "",
      email: decryptFieldSync(c.email) ?? "",
      notas: decryptFieldSync(c.notas) ?? "",
    };
  });

  // Ordenar en memoria por nombre alfabéticamente (ya que en BD está cifrado)
  return decrypted.sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? ""));
}

// ── Crear contacto ────────────────────────────────────────────────────────
export async function crearContacto(espacioId: string, formData: FormData) {
  if (!isValidUuid(espacioId)) return { error: { _global: ["Espacio de trabajo no válido"] } };

  const parsed = contactoSchema.safeParse({
    nombre: sanitizeText(formData.get("nombre")),
    telefono: sanitizeText(formData.get("telefono"), 30),
    email: formData.get("email"),
    notas: sanitizeText(formData.get("notas")),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase.from("contactos").insert({
    espacio_id: espacioId,
    nombre: encryptFieldSync(parsed.data.nombre)!,
    telefono: encryptFieldSync(parsed.data.telefono),
    email: encryptFieldSync(parsed.data.email),
    notas: encryptFieldSync(parsed.data.notas),
  });

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/contactos");
  return { success: true };
}

// ── Actualizar contacto ───────────────────────────────────────────────────
export async function actualizarContacto(contactoId: string, espacioId: string, formData: FormData) {
  if (!isValidUuid(contactoId) || !isValidUuid(espacioId)) {
    return { error: { _global: ["Identificador de contacto o espacio no válido"] } };
  }

  const parsed = contactoSchema.safeParse({
    nombre: sanitizeText(formData.get("nombre")),
    telefono: sanitizeText(formData.get("telefono"), 30),
    email: formData.get("email"),
    notas: sanitizeText(formData.get("notas")),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("contactos")
    .update({
      nombre: encryptFieldSync(parsed.data.nombre)!,
      telefono: encryptFieldSync(parsed.data.telefono),
      email: encryptFieldSync(parsed.data.email),
      notas: encryptFieldSync(parsed.data.notas),
    })
    .eq("id", contactoId)
    .eq("espacio_id", espacioId);

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/contactos");
  return { success: true };
}

// ── Archivar (borrado lógico) contacto ────────────────────────────────────
export async function archivarContacto(contactoId: string, espacioId: string) {
  if (!isValidUuid(contactoId) || !isValidUuid(espacioId)) {
    return { error: "Identificador no válido" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("contactos")
    .update({ archivado_en: new Date().toISOString() })
    .eq("id", contactoId)
    .eq("espacio_id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/contactos");
  return { success: true };
}
