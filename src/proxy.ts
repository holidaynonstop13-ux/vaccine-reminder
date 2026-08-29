import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;

  if (auth) {
    const encoded = auth.split(" ")[1] ?? "";
    const [inputUser, inputPass] = Buffer.from(encoded, "base64")
      .toString()
      .split(":");
    if (inputUser === user && inputPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("กรุณาเข้าสู่ระบบ", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
