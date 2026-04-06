import { NextResponse } from "next/server";

const PASSWORD = process.env.SITE_PASSWORD || "productivemoney2026";

export async function POST(request) {
  const { password } = await request.json();

  if (password === PASSWORD) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set("site-auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  }

  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
