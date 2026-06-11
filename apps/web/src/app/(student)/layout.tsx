import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StudentHeaderClient } from "@/components/student-header";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role ?? null,
        subscriptionPlan: (session.user as any).subscriptionPlan ?? null,
        expiresAt: (session.user as any).expiresAt ?? null,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f4]">
      {/* ─── STUDENT HEADER ─── */}
      <StudentHeaderClient user={user} />

      {/* ─── CONTENT AREA ─── */}
      <div className="flex flex-1">
        <main className="flex-1 px-6 py-8 sm:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
