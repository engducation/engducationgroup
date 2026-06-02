import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="w-full bg-background border-t pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Company / Brand Info */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="font-bold text-xl tracking-tight text-primary">
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                Engducation <span className="text-sky-400">❄️</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nền tảng EdTech tiên phong tích hợp trí tuệ nhân tạo, hỗ trợ người học tối ưu hóa toàn diện kỹ năng Ngữ pháp và Viết luận tiếng Anh chuyên nghiệp.
            </p>
          </div>

          {/* Column 2: Products */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-bold tracking-wider uppercase text-primary">
              Sản phẩm
            </h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <Link href="/#features" className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Khóa học ngữ pháp
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Ngân hàng Quiz
                </Link>
              </li>
              <li>
                <Link href="/#ai-demo" className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Trợ lý ảo AI Writing
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Bảng giá dịch vụ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-bold tracking-wider uppercase text-primary">
              Chính sách
            </h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <Link href={"/terms" as never} className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link href={"/privacy" as never} className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Chính sách bảo mật JWT
                </Link>
              </li>
              <li>
                <Link href={"/refund" as never} className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Cơ chế hoàn trả học phí
                </Link>
              </li>
              <li>
                <Link href={"/compliance" as never} className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Tuân thủ dữ liệu người dùng
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-bold tracking-wider uppercase text-primary">
              Liên hệ
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Đội ngũ phát triển dự án EdTech AI.
            </p>
            <p className="text-sm font-medium text-primary">
              Email: <Link href="mailto:support@engducation.edu.vn" className="hover:underline">support@engducation.edu.vn</Link>
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between text-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 Engducation. Toàn bộ bản quyền hệ thống được bảo lưu.</p>
          <div className="flex gap-4">
            <Link href={"/privacy" as never} className="hover:text-primary transition-colors">Bảo mật</Link>
            <Link href={"/terms" as never} className="hover:text-primary transition-colors">Điều khoản</Link>
            <Link href={"/sitemap" as never} className="hover:text-primary transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
