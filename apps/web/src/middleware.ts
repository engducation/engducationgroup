import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ áp dụng kiểm tra cho các tuyến đường bắt đầu bằng /admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("better-auth.session_token")?.value;

    // Trường hợp 1: Không có token -> Đá về trang login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Trường hợp 2: Cookie user_role không phải ADMIN -> Chặn quyền truy cập
    const userRole = request.cookies.get("user_role")?.value;
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
