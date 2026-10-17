"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/iniciar-sesion?error=${encodeURIComponent("No se pudo iniciar sesión. Revisa tus datos.")}`);

  const cookieStore = await cookies();
  cookieStore.set("finpal_last_active", Date.now().toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });

  cookieStore.set("finpal_remember_session", remember ? "true" : "false", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });

  redirect("/espacios");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) redirect(`/registrarse?error=${encodeURIComponent("No se pudo crear la cuenta. Inténtalo de nuevo.")}`);
  redirect("/iniciar-sesion?mensaje=Revisa tu correo para confirmar tu cuenta.");
}

export async function signInWithOAuth(provider: "google" | "github") {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/iniciar-sesion?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
}

export async function signInWithGoogle() {
  return signInWithOAuth("google");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("finpal_last_active");
  cookieStore.delete("finora_last_active");
  cookieStore.delete("finpal_remember_session");
  redirect("/iniciar-sesion");
}
