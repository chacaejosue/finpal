"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contactoSchema } from "@/lib/validations/schemas";

// ── Listar contactos del espacio ──────────────────────────────────────────
export async function getContactos(espacioId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contactos")
    .select(`
      id, nombre, telefono, email, notas, archivado_en, created_at,
      prestamos(id, monto_principal, monto_capital_pagado, estado)
    `)
    .eq("espacio_id", espacioId)
    .is("archivado_en", null)
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Crear contacto ────────────────────────────────────────────────────────
export async function crearContacto(espacioId: string, formData: FormData) {
  const parsed = contactoSchema.safeParse({
    nombre: formData.get("nombre"),
    telefono: formData.get("telefono"),
    email: formData.get("email"),
    notas: formData.get("notas"),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase.from("contactos").insert({
    espacio_id: espacioId,
    ...parsed.data,
  });

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/contactos");
  return { success: true };
}

// ── Actualizar contacto ───────────────────────────────────────────────────
export async function actualizarContacto(contactoId: string, espacioId: string, formData: FormData) {
  const parsed = contactoSchema.safeParse({
    nombre: formData.get("nombre"),
    telefono: formData.get("telefono"),
    email: formData.get("email"),
    notas: formData.get("notas"),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contactos")
    .update(parsed.data)
    .eq("id", contactoId)
    .eq("espacio_id", espacioId);

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/contactos");
  return { success: true };
}

// ── Archivar (soft-delete) contacto ──────────────────────────────────────
export async function archivarContacto(contactoId: string, espacioId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contactos")
    .update({ archivado_en: new Date().toISOString() })
    .eq("id", contactoId)
    .eq("espacio_id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/contactos");
  return { success: true };
}
