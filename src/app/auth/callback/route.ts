import { NextRequest, NextResponse } from "next/server";
import { accountClient } from "@/lib/supabase-server";
import { safeNext } from "@/lib/account-validation";
import { cookies } from "next/headers";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  if (code) {
    try {
      const client = await accountClient();
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        if (next === "/reset-password")
          (await cookies()).set("stride-recovery", data.user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 600,
          });
        const response = NextResponse.redirect(new URL(next, request.url));
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
    } catch {
      /* Missing configuration and expired codes share a safe error. */
    }
  }
  return NextResponse.redirect(new URL("/login?callbackError=1", request.url));
}
