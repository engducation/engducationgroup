import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function requireAdminRequest() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), admin: null };
  }

  if (session.user.role !== "admin") {
    return { errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }), admin: null };
  }

  return {
    errorResponse: null,
    admin: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as string | undefined,
    },
  };
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiError(error: unknown, fallbackMessage = "Internal Server Error") {
  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 500 });
}
