import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bloquea peticiones anónimas
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, timestamp: Date.now() });
  response.cookies.set("finpal_last_active", Date.now().toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

