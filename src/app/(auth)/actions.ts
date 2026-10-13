"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/iniciar-sesion?error=${encodeURIComponent("No se pudo iniciar sesión. Revisa tus datos.")}`);
  redirect("/inicio");
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
  redirect("/iniciar-sesion");
}
