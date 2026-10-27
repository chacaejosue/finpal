import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
  // Bloquear ráfagas antes de invocar a Supabase Auth
  const rl = await checkRateLimit({
    action: "api:heartbeat",
    limit: 6,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.message },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      }
    );
  }

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
