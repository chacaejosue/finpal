import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true, timestamp: Date.now() });
  response.cookies.set("finpal_last_active", Date.now().toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
