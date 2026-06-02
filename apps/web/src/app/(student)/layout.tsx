import Link from "next/link";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER HỌC VIÊN - Tách biệt hoàn toàn với Header Landing Page */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-white/80 backdrop-blur-md px-6 sm:px-12">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-slate-900"
          >
            Engducation ❄️
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              href="/dashboard"
              className="text-indigo-600 font-semibold"
            >
              Lớp học của tôi
            </Link>
            <Link
              href={"/notebook" as any}
              className="hover:text-slate-900 transition"
            >
              Sổ tay từ vựng
            </Link>
            <Link
              href={"/ai-assistant" as any}
              className="hover:text-slate-900 transition"
            >
              Trợ lý AI
            </Link>
          </nav>
        </div>

        {/* Trạng thái gói tài khoản của học viên */}
        <div className="flex items-center gap-4">
          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            Premium Pro
          </span>
          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-medium text-sm text-slate-700 border">
            HV
          </div>
        </div>
      </header>

      {/* VÙNG CHỨA NỘI DUNG HỌC TẬP */}
      <div className="flex flex-1">
        <main className="flex-1 px-6 py-8 sm:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
