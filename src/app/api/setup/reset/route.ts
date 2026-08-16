import { NextResponse } from "next/server";
import { resetConfig } from "@/lib/config";

/** Sadece development — kurulumu sıfırlayıp /setup açar. */
export async function GET(request: Request) {
  return resetAndRedirect(request);
}

export async function POST(request: Request) {
  return resetAndRedirect(request);
}

async function resetAndRedirect(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Production'da kurulum sıfırlanamaz" },
      { status: 403 },
    );
  }

  await resetConfig();

  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/setup", url.origin));
  response.cookies.set("nbdsx_setup", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });
  return response;
}
