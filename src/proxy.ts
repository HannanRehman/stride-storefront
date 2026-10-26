import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const client = createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        response.headers.set("Cache-Control", "private, no-store");
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const { data } = await client.auth.getClaims();
  if (
    !data?.claims &&
    (request.nextUrl.pathname.startsWith("/account") ||
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname === "/checkout")
  ) {
    const target = new URL("/login", request.url);
    target.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  return response;
}
export const config = {
  matcher: [
    "/account/:path*",
    "/checkout",
    "/api/checkout/:path*",
    "/api/orders/:path*",
    "/api/requests/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/account/:path*",
    "/api/auth/:path*",
    "/auth/:path*",
    "/reset-password",
  ],
};
