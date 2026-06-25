"use client";

import {
  ArrowRight,
  Check,
  GraduationCap,
  Sparkles,
  Star,
  Users,
  TrendingUp,
  FileText,
  Brain,
  Target,
  BookOpen,
  Mic,
  Play,
  Award,
} from "lucide-react";
import Link from "next/link";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Minh Anh",
    role: "Sinh viên năm 3, ĐH Ngoại thương",
    avatar: "MA",
    content: "Trước đây tôi rất sợ viết luận IELTS. Sau khi dùng Engducation, AI của họ chỉ ra lỗi sai và gợi ý cách cải thiện rất chi tiết. Điểm viết của tôi đã tăng từ 5.5 lên 7.0!",
    rating: 5,
  },
  {
    name: "Hoàng Nam",
    role: "Nhân viên văn phòng, FPT Software",
    avatar: "HN",
    content: "App học ngữ pháp rất trực quan, video bài giảng chất lượng cao. Tôi đặc biệt thích tính năng AI Writing Assistant - giờ email công việc bằng tiếng Anh tự tin hơn nhiều.",
    rating: 5,
  },
  {
    name: "Thu Hà",
    role: "Học sinh lớp 12, chuẩn bị thi TOEIC",
    avatar: "TH",
    content: "Hệ thống quiz rất hay, có giải thích ngữ pháp từng câu. Nhờ đó tôi hiểu bài sâu hơn thay vì chỉ học vẹt. Điểm TOEIC mock test đã đạt 850 sau 2 tháng.",
    rating: 5,
  },
];

const stats = [
  { value: "10,000+", label: "Học viên đăng ký", icon: Users },
  { value: "500+", label: "Bài học video", icon: Play },
  { value: "95%", label: "Học viên hài lòng", icon: Star },
  { value: "24/7", label: "Hỗ trợ AI", icon: Brain },
];

const features = [
  {
    icon: BookOpen,
    title: "Video bài giảng chất lượng cao",
    description: "Hệ thống bài giảng được thiết kế chuyên nghiệp, truyền tải mượt mà qua Cloudinary CDN. Tự động lưu tiến độ học.",
    highlights: ["Streaming 1080p không giật lag", "Phụ đề tiếng Anh/Việt", "Tốc độ phát 1.5x"],
  },
  {
    icon: Award,
    title: "Quiz tương tác củng cố kiến thức",
    description: "Bài tập trắc nghiệm được thiết kế khoa học theo phương pháp spaced repetition, giúp ghi nhớ từ vựng và ngữ pháp hiệu quả.",
    highlights: ["Phản hồi đáp án tức thì", "Giải thích chi tiết từng câu", "Theo dõi tiến độ học tập"],
  },
  {
    icon: Brain,
    title: "AI Writing Assistant thông minh",
    description: "Sửa lỗi ngữ pháp, chính tả và gợi ý từ vựng nâng cao theo phong cách viết học thuật hoặc công việc.",
    highlights: ["Phân tích lỗi chi tiết", "So sánh trước/sau", "Gợi ý đa dạng phong cách"],
  },
  {
    icon: Target,
    title: "Lộ trình học cá nhân hóa",
    description: "AI phân tích điểm mạnh/yếu và đề xuất lộ trình phù hợp từ A1 đến C1, phù hợp với mục tiêu IELTS, TOEIC hay giao tiếp.",
    highlights: ["Đánh giá trình độ đầu vào", "Kế hoạch học tập 30 ngày", "Điều chỉnh theo tiến độ"],
  },
  {
    icon: Mic,
    title: "Luyện phát âm với AI",
    description: "Sử dụng speech recognition để đánh giá phát âm và gợi ý cải thiện từng từ, giúp bạn tự tin giao tiếp.",
    highlights: ["Chấm điểm phát âm AI", "So sánh với người bản ngữ", "Luyện tập theo chủ đề"],
  },
  {
    icon: FileText,
    title: "Sổ từ vựng thông minh",
    description: "Lưu trữ và ôn tập từ vựng theo danh mục, sử dụng phương pháp spaced repetition để nhớ lâu hơn.",
    highlights: ["Flashcard thông minh", "Ôn tập định kỳ tự động", "Xuất danh sách cá nhân"],
  },
];

export default function HomeClient() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full py-20 md:py-32 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 -z-10" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-violet-200/40 via-indigo-200/20 to-transparent rounded-full blur-3xl -z-10" />

          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 flex flex-col items-start space-y-8 text-left">

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                  Làm Chủ Kỹ Năng{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
                    Viết Tiếng Anh
                  </span>{" "}
                  Với AI
                </h1>

                <p className="text-lg md:text-xl text-slate-600 max-w-[600px] leading-relaxed">
                  Nền tảng học tập trực tuyến đột phá. Học ngữ pháp qua video chất lượng cao, làm quiz tương tác và nâng tầm bài viết luận ngay lập tức với AI sửa lỗi thông minh.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link href="/login">
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 shadow-xl shadow-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/40 gap-2">
                      Bắt đầu miễn phí <ArrowRight className="size-5" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-slate-200 hover:bg-slate-50 gap-2 text-slate-700 font-semibold">
                      Khám phá tính năng
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {["MA", "HN", "TH", "PT"].map((initials, i) => (
                        <div key={i} className="size-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                          {initials}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">
                      <span className="font-bold text-slate-900">10,000+</span> học viên
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Media Display */}
              <div className="lg:col-span-5 relative">
                <div className="relative w-full aspect-square lg:aspect-[4/5]">
                  {/* Floating cards */}
                  <div className="absolute top-0 right-0 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-5 animate-float z-10 max-w-[280px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                        <Check className="size-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Bài kiểm tra hoàn thành</p>
                        <p className="text-xs text-slate-500">Past Simple Tense</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-[90%] bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" />
                      </div>
                      <span className="text-sm font-bold text-emerald-600">90%</span>
                    </div>
                  </div>

                  {/* AI Assistant Card */}
                  <div className="absolute bottom-20 left-0 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-4 animate-float-delayed z-10 max-w-[260px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="size-4 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-600">AI Writing Assistant</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3">
                      "Consider using <span className="font-semibold text-indigo-600">however</span> instead of <span className="line-through text-red-400">but</span> for a more formal tone..."
                    </p>
                  </div>

                  {/* Main visual */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-64 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
                      <GraduationCap className="size-24 text-white/90" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="w-full py-12 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center size-12 rounded-xl bg-white/20 backdrop-blur-sm mb-3">
                    <stat.icon className="size-6 text-white" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-white">{stat.value}</p>
                  <p className="text-sm text-white/70 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="w-full py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center flex flex-col items-center justify-center space-y-4 mb-16">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-semibold border-indigo-200 bg-indigo-50 text-indigo-700">
                Tính năng nổi bật
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
                Giải Pháp Toàn Diện Cho Hành Trình Ngôn Ngữ
              </h2>
              <p className="text-muted-foreground text-lg max-w-[700px]">
                Sự kết hợp hoàn hảo giữa video chất lượng cao và AI chuyên sâu giúp bạn vượt qua mọi rào cản ngữ pháp
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className="h-1.5 -mx-6 -mt-6 mb-6 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 w-fit rounded-xl text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold mt-4 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed mt-2">
                    {feature.description}
                  </p>
                  <ul className="space-y-2 mt-4">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="size-4 text-emerald-500 shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="w-full py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center flex flex-col items-center justify-center space-y-4 mb-16">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-semibold border-indigo-200 bg-indigo-50 text-indigo-700">
                Học viên nói gì
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
                Tin Tưởng Từ Hàng Nghìn Học Viên
              </h2>
              <p className="text-muted-foreground text-lg max-w-[600px]">
                Những câu chuyện thật từ học viên đã thay đổi kỹ năng tiếng Anh của họ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-slate-600 leading-relaxed mb-6">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="w-full py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center flex flex-col items-center justify-center space-y-4 mb-16">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-semibold border-indigo-200 bg-indigo-50 text-indigo-700">
                Bảng giá
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
                Lựa Chọn Gói Học Tập Phù Hợp
              </h2>
              <p className="text-muted-foreground text-lg max-w-[600px]">
                Nâng cấp tài khoản để trải nghiệm sức mạnh toàn vẹn của hệ thống AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
              {/* Card 1: Gói 1 Tháng */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 lg:p-8 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">Gói Cơ Bản</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">49K</span>
                      <span className="text-slate-500">/ tháng</span>
                    </div>
                    <p className="text-sm text-slate-500">Phù hợp để trải nghiệm</p>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                      Học từ vựng theo danh mục
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                      Quiz trắc nghiệm cơ bản
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                      Xem video bài giảng (giới hạn)
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="w-full mt-8">
                  <Button variant="outline" className="w-full py-5 font-bold border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl">
                    Đăng ký ngay
                  </Button>
                </Link>
              </div>

              {/* Card 2: Gói 6 Tháng */}
              <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 lg:p-8 shadow-2xl shadow-indigo-500/30 flex flex-col relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 font-black px-4 py-1 rounded-full text-xs uppercase shadow-lg">
                  Phổ biến nhất
                </div>
                <div className="space-y-6 flex-1 pt-2">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">Gói Premium</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">269K</span>
                      <span className="text-white/70">/ 6 tháng</span>
                    </div>
                    <p className="text-sm text-white/70">Tiết kiệm 10% so với mua lẻ</p>
                  </div>
                  <div className="h-px bg-white/20" />
                  <ul className="space-y-3 text-sm text-white/90">
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-white shrink-0 mt-0.5" />
                      Tất cả tính năng gói cơ bản
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-white shrink-0 mt-0.5" />
                      Video bài giảng không giới hạn
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-white shrink-0 mt-0.5" />
                      Quiz nâng cao + giải thích chi tiết
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-white shrink-0 mt-0.5" />
                      AI Writing Assistant (50 lượt/tháng)
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="w-full mt-8">
                  <Button className="w-full py-5 font-bold bg-white hover:bg-white/90 text-indigo-600 shadow-xl rounded-xl">
                    Nâng cấp ngay
                  </Button>
                </Link>
              </div>

              {/* Card 3: Gói 1 Năm */}
              <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 flex flex-col relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black px-4 py-1 rounded-full text-xs uppercase shadow-lg z-10">
                  Tiết kiệm nhất
                </div>
                <div className="space-y-6 flex-1 pt-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">Gói Pro</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">499K</span>
                      <span className="text-slate-400">/ năm</span>
                    </div>
                    <p className="text-sm text-slate-400">Tương đương 42K/tháng</p>
                  </div>
                  <div className="h-px bg-slate-700" />
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                      Tất cả tính năng Premium
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                      AI Writing Assistant không giới hạn
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                      Báo cáo phân tích AI hàng tháng
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                      Hỗ trợ ưu tiên 24/7
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="w-full mt-8">
                  <Button className="w-full py-5 font-bold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white shadow-xl rounded-xl">
                    Mua ngay
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 md:p-12 lg:p-16 text-center">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              </div>

              <div className="relative">
                <Sparkles className="size-12 text-amber-300 mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
                  Sẵn Sàng Bắt Đầu Hành Trình?
                </h2>
                <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                  Đăng ký miễn phí ngay hôm nay và nhận ưu đãi 20% cho gói Premium. Không cần thẻ tín dụng.
                </p>
                <Link href="/login">
                  <Button size="lg" className="bg-white hover:bg-white/90 text-indigo-600 font-bold px-8 shadow-xl gap-2">
                    Đăng ký miễn phí <ArrowRight className="size-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ROADMAP SECTION */}
        <section id="roadmap" className="w-full py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center space-y-6">
              <GraduationCap className="size-14 text-indigo-600" />
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Lộ Trình Học Tập Phát Triển Bền Vững
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                Mỗi bài học được thiết kế có hệ thống giúp xây dựng nền tảng ngữ pháp vững chắc từ A1 đến C1. Kết hợp sự giám sát từ AI, bạn sẽ nhanh chóng nhận diện điểm yếu và cải thiện lỗi sai phổ biến.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                  <Target className="size-4" /> CEFR A1-C1
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold text-sm">
                  <FileText className="size-4" /> IELTS Writing
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                  <TrendingUp className="size-4" /> TOEIC Practice
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
