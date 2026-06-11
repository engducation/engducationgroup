"use client";

import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  GraduationCap,
  Play,
  Sparkles,
  Zap
} from "lucide-react";
import Link from "next/link";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomeClient() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full py-16 md:py-28 container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Phiên bản 1.0 — Tích hợp Groq AI (Llama3-70B, tốc độ mili-giây)
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-primary">
                Làm Chủ Kỹ Năng <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300">
                  Viết Tiếng Anh
                </span>{" "}
                Với AI
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-[620px] leading-relaxed">
                Nền tảng học tập trực tuyến đột phá. Học ngữ pháp qua video chất lượng cao, làm quiz tương tác và nâng tầm bài viết luận ngay lập tức với công nghệ AI sửa lỗi thông minh hoạt động 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
                <Link href="#features">
                  <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/20 transition-all hover:shadow-xl hover:shadow-indigo-600/30 gap-2">
                    Khám phá ngay <Play className="size-4 fill-current" />
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-muted-foreground/20 hover:bg-muted/40 gap-2">
                    Xem bảng giá <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Media Display */}
            <div className="lg:col-span-5 relative w-full aspect-square md:aspect-video lg:aspect-square flex items-center justify-center rounded-2xl border bg-muted/20 overflow-hidden shadow-xl shadow-muted-foreground/5">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent z-0" />
              <div className="z-10 w-11/12 bg-card border rounded-xl shadow-2xl p-6 flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Engducation v1.0</span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="size-3.5" /> Bài học mới
                  </div>
                  <div className="bg-muted/40 p-3 rounded border border-dashed space-y-2">
                    <div className="h-3 bg-indigo-200 dark:bg-indigo-900/50 rounded w-3/4" />
                    <div className="h-2 bg-muted-foreground/20 rounded w-full" />
                    <div className="h-2 bg-muted-foreground/20 rounded w-5/6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                    <Award className="size-3.5" /> Quiz hoàn thành
                  </div>
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Past Simple Tense</span>
                      <span className="text-xs font-bold text-emerald-600">9/10</span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[90%] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section id="features" className="w-full py-16 md:py-24 bg-muted/30 border-y">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center flex flex-col items-center justify-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
                Giải Pháp Toàn Diện Cho Hành Trình Ngôn Ngữ
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-[650px]">
                Sự kết hợp hoàn hảo giữa công cụ truyền thông đa phương tiện chất lượng cao và AI chuyên sâu giúp bạn vượt qua mọi rào cản ngữ pháp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
                <CardHeader>
                  <div className="p-3 bg-indigo-500/10 w-fit rounded-lg text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="size-6" />
                  </div>
                  <CardTitle className="text-xl font-bold mt-4">Học Tập Qua Video Trực Quan</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
                    Hệ thống bài giảng ngữ pháp và từ vựng phân cấp rõ ràng. Tích hợp công nghệ lưu trữ đám mây Cloudinary giúp truyền tải video mượt mà ở chất lượng cao mà không giật lag.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-indigo-600" /> Streaming chất lượng 1080p
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-indigo-600" /> Tự động lưu tiến độ xem video
                  </div>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
                <CardHeader>
                  <div className="p-3 bg-indigo-500/10 w-fit rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Award className="size-6" />
                  </div>
                  <CardTitle className="text-xl font-bold mt-4">Luyện Tập Với Quiz Tương Tác</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
                    Học đi đôi với hành. Hệ thống câu hỏi trắc nghiệm được thiết kế ngay sau mỗi bài học, giúp bạn củng cố kiến thức ngữ pháp và ghi nhớ từ vựng theo danh mục một cách khoa học.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-indigo-600" /> Phản hồi đáp án ngay lập tức
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-indigo-600" /> Giải thích ngữ pháp chi tiết từng câu
                  </div>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
                <CardHeader>
                  <div className="p-3 bg-indigo-500/10 w-fit rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="size-6" />
                  </div>
                  <CardTitle className="text-xl font-bold mt-4">Sửa Lỗi & Tối Ưu Văn Phong AI</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
                    Tiếp nhận văn bản, phân tích chuyên sâu qua Prompt Engineering để trả về kết quả so sánh lỗi chính tả, ngữ pháp và gợi ý thay đổi từ vựng theo các phong cách hành văn chuyên nghiệp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-indigo-600" /> Nhận diện lỗi ngữ pháp phức tạp
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-indigo-600" /> Đề xuất từ vựng nâng cao tự động
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="w-full py-16 md:py-24 bg-muted/30 border-y">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center flex flex-col items-center justify-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
                Lựa Chọn Gói Học Tập Phù Hợp
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-[600px]">
                Nâng cấp tài khoản của bạn để trải nghiệm sức mạnh toàn vẹn của hệ thống trí tuệ nhân tạo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
              {/* Card 1: Gói 1 Tháng */}
              <Card className="bg-card border flex flex-col justify-between p-6 lg:p-8 hover:shadow-lg transition-all duration-300 relative">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">Gói 1 Tháng</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-primary">49.000đ</span>
                      <span className="text-sm text-muted-foreground">/ tháng</span>
                    </div>
                  </div>
                  <Separator />
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" /> Học từ vựng theo danh mục hệ thống.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" /> Làm bài tập Quiz trắc nghiệm cơ bản.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" /> Xem video bài giảng (Giới hạn số lượng).
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="w-full mt-8">
                  <Button variant="outline" className="w-full py-5 font-bold border-slate-300 hover:bg-slate-50 text-slate-700">
                    Đăng Ký Ngay
                  </Button>
                </Link>
              </Card>

              {/* Card 2: Gói 6 Tháng - Badge "Phổ biến" */}
              <Card className="relative bg-card border-2 border-blue-600 shadow-xl flex flex-col justify-between p-6 lg:p-8 z-10 transition-all duration-300">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 hover:bg-blue-100 text-blue-700 font-extrabold px-4 py-1 rounded-full uppercase tracking-wider text-xs border border-blue-200">
                  Phổ biến
                </Badge>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">Gói 6 Tháng</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-primary">249.000đ</span>
                      <span className="text-sm text-muted-foreground">/ 6 tháng</span>
                    </div>
                  </div>
                  <Separator />
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" /> Bao gồm tất cả quyền lợi gói Cơ Bản.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" /> Xem không giới hạn toàn bộ video bài giảng.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" /> Hệ thống Quiz trắc nghiệm nâng cao.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" /> Sử dụng AI Writing Assistant (Giới hạn lượt dùng/tháng).
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="w-full mt-8">
                  <Button variant="default" className="w-full py-5 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                    Nâng Cấp Ngay
                  </Button>
                </Link>
              </Card>

              {/* Card 3: Gói 1 Năm - Badge "Tiết Kiệm Nhất" */}
              <Card className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 flex flex-col justify-between p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="relative">
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-500 text-slate-900 font-extrabold px-4 py-1 rounded-full uppercase tracking-wider text-xs border border-amber-300 shadow-lg shadow-amber-500/20">
                    Tiết Kiệm Nhất
                  </Badge>
                </div>
                <div className="relative space-y-5 pt-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Gói 1 Năm</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white">499.000đ</span>
                      <span className="text-sm text-slate-400">/ năm</span>
                    </div>
                  </div>
                  <Separator className="border-slate-700" />
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" /> Bao gồm tất cả quyền lợi gói 6 Tháng.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" /> Sử dụng AI Writing Assistant (Không giới hạn request).
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" /> Nhận báo cáo phân tích lộ trình học tập chuyên sâu từ AI.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" /> Hỗ trợ ưu tiên từ đội ngũ giáo vụ (24/7).
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="w-full mt-8 relative">
                  <Button className="w-full py-5 font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/30 transition-all">
                    Mua Ngay
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* ROADMAP / ACCREDITATION */}
        <section id="roadmap" className="w-full py-16 md:py-24 container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center space-y-6">
            <GraduationCap className="size-12 text-indigo-600" />
            <h2 className="text-3xl font-extrabold tracking-tight text-primary">
              Lộ Trình Học Tập Phát Triển Bền Vững
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Mỗi bài học được thiết kế có hệ thống giúp xây dựng nền tảng ngữ pháp vững chắc từ A1 đến C1. Kết hợp sự giám sát từ AI, bạn sẽ nhanh chóng nhận diện điểm yếu, cải thiện lỗi sai phổ biến và viết chuẩn học thuật trong thời gian ngắn nhất.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-4 opacity-75">
              <span className="font-bold text-sm tracking-widest text-muted-foreground uppercase">CEFR A1-C1</span>
              <span className="font-bold text-sm tracking-widest text-muted-foreground uppercase">IELTS Writing Support</span>
              <span className="font-bold text-sm tracking-widest text-muted-foreground uppercase">TOEIC Practice</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
