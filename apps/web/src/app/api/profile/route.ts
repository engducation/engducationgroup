import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, address } = body;

    // Validate input
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: "Tên không hợp lệ" },
          { status: 400 }
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { success: false, message: "Tên không được quá 100 ký tự" },
          { status: 400 }
        );
      }
    }

    // Update user
    await db
      .update(user)
      .set({
        name: name?.trim() || undefined,
        phone: phone || null,
        address: address || null,
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
