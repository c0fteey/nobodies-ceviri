import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export async function GET(request: Request) {
  const config = await getConfig();
  const url = new URL(request.url);

  if (!config.setupCompleted) {
    return NextResponse.redirect(new URL("/setup", url.origin));
  }

  // /login public: cookie Set-Cookie sonrası middleware /setup döngüsüne girmez
  const response = NextResponse.redirect(new URL("/login", url.origin));
  response.cookies.set("nbdsx_setup", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return response;
}
