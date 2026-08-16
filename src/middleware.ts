import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSetupCompleteSync } from "@/lib/setup-status";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const setupDone =
    isSetupCompleteSync() ||
    request.cookies.get("nbdsx_setup")?.value === "1";

  const isPublic =
    pathname.startsWith("/setup") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup");

  if (!setupDone && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/setup";
    return NextResponse.redirect(url);
  }

  if (setupDone && pathname.startsWith("/setup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (setupDone && !isPublic && !pathname.startsWith("/api")) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
