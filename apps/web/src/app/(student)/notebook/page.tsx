import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function NotebookPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Sổ tay từ vựng</h1>
      <p className="text-sm text-slate-500 mb-6">
        Lưu lại những từ vựng bạn đã học
      </p>
      <div className="rounded-xl border border-dashed bg-white p-12 text-center">
        <p className="text-sm text-slate-500">
          Tính năng đang được phát triển
        </p>
      </div>
    </div>
  );
}
