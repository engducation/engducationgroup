import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import "@/index.css";
import Providers from "@/components/providers";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Engducation — Học Tiếng Anh với AI",
  description:
    "Nền tảng học tiếng Anh trực tuyến. Học ngữ pháp qua video chất lượng cao, làm quiz tương tác và nâng tầm bài viết luận ngay lập tức với công nghệ AI sửa lỗi thông minh hoạt động 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} scroll-smooth`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-slate-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
