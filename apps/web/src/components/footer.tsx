import Link from "next/link";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Mail } from "lucide-react";

export default function Footer() {
  const router = useRouter();

  return (
    <footer className="w-full bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Brand */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <GraduationCap className="size-5 text-white" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Engducation
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nền tảng EdTech tích hợp AI, hỗ trợ tối ưu hóa kỹ năng Ngữ pháp và Viết luận tiếng Anh chuyên nghiệp.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Mail className="size-4" />
              <a href="mailto:support@engducation.edu.vn" className="hover:text-white transition-colors">
                support@engducation.edu.vn
              </a>
            </div>
          </div>

          {/* Column 2: Sản phẩm */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Sản phẩm
            </h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <Link href="/#features" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Khóa học
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Ngữ pháp
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hỗ trợ */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Hỗ trợ
            </h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <button
                  // @ts-ignore
                  onClick={() => router.push("/support")}
                  className="text-sm text-slate-400 hover:text-white transition-colors text-left"
                >
                  Gửi yêu cầu hỗ trợ
                </button>
              </li>
              <li>
                <a href="mailto:support@engducation.edu.vn" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Liên hệ hỗ trợ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Pháp lý */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Pháp lý
            </h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <span className="text-sm text-slate-400">
                  Điều khoản sử dụng
                </span>
              </li>
              <li>
                <span className="text-sm text-slate-400">
                  Chính sách bảo mật
                </span>
              </li>
              <li>
                <span className="text-sm text-slate-400">
                  Chính sách hoàn tiền
                </span>
              </li>
              <li>
                <span className="text-sm text-slate-400">
                  Chính sách cookie
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-slate-800 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between text-center gap-4">
          <p className="text-sm text-slate-500">
            © 2026 Engducation. Toàn bộ bản quyền được bảo lưu.
          </p>
          <p className="text-sm text-slate-500">
            Môn học EXE — Trường Đại học FPT (FPTU)
          </p>
        </div>
      </div>
    </footer>
  );
}
