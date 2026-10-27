"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, isBotHoneypotTriggered } from "@/lib/rate-limit";
import { LEGAL_VERSION } from "@/config/legal-content";

export async function signIn(formData: FormData) {
  if (isBotHoneypotTriggered(formData)) {
    redirect(`/iniciar-sesion?error=${encodeURIComponent("Solicitud rechazada por filtro de seguridad.")}`);
  }

  const rl = await checkRateLimit({
    action: "auth:signin",
    limit: 8,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    redirect(`/iniciar-sesion?error=${encodeURIComponent(rl.message!)}`);
  }

  const email = String(formData.get("email") ?? "").trim().slice(0, 150);
  const password = String(formData.get("password") ?? "").slice(0, 256);
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
  if (isBotHoneypotTriggered(formData)) {
    redirect(`/registrarse?error=${encodeURIComponent("Solicitud rechazada por filtro anti-bots.")}`);
  }

  const rl = await checkRateLimit({
    action: "auth:signup",
    limit: 5,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    redirect(`/registrarse?error=${encodeURIComponent(rl.message!)}`);
  }

  const acceptTerms = formData.get("accept_terms") === "on";
  if (!acceptTerms) {
    redirect(
      `/registrarse?error=${encodeURIComponent(
        "Debes aceptar los Términos de Servicio y la Política de Privacidad para crear una cuenta."
      )}`
    );
  }

  const email = String(formData.get("email") ?? "").trim().slice(0, 150);
  const password = String(formData.get("password") ?? "").slice(0, 256);

  if (password.length < 8) {
    redirect(
      `/registrarse?error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres.")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        terms_accepted_at: new Date().toISOString(),
        terms_version: LEGAL_VERSION,
      },
    },
  });

  if (error) redirect(`/registrarse?error=${encodeURIComponent("No se pudo crear la cuenta. Inténtalo de nuevo.")}`);
  redirect("/iniciar-sesion?mensaje=Revisa tu correo para confirmar tu cuenta.");
}

export async function signInWithOAuth(provider: "google" | "github") {
  const rl = await checkRateLimit({
    action: "auth:oauth",
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    redirect(`/iniciar-sesion?error=${encodeURIComponent(rl.message!)}`);
  }

  const supabase = await createClient();
  const rawOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  const origin = (
    rawOrigin.startsWith("http://") || rawOrigin.startsWith("https://")
      ? rawOrigin
      : `https://${rawOrigin}`
  ).replace(/\/$/, "");

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
