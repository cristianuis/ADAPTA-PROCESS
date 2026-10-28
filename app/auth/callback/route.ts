import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=magic-link", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Do not log the one-time code or provider response; both may contain secrets.
    console.error("No se pudo completar el callback de autenticación.");
    return NextResponse.redirect(new URL("/login?error=magic-link", request.url));
  }

  return NextResponse.redirect(new URL("/lancelot", request.url));
}
