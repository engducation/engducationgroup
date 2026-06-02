"use client";

import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  GraduationCap,
  Lock,
  Play,
  Sparkles,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import Footer from "@/components/footer";
import Header from "@/components/header";
import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Home() {
  // States for Interactive AI Demo
  const [inputText, setInputText] = useState("She go to school yesterday and she forget her book...");
  const [isPending, setIsPending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("input");
  const [requestCount, setRequestCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Corrected Text and Explanations
  const correctedText = "She went to school yesterday and she forgot her book.";
  const corrections = [
    {
      original: "go",
      corrected: "went",
      reason: "Mệnh đề có trạng từ chỉ thời gian quá khứ 'yesterday', yêu cầu động từ chia ở thì Quá khứ Đơn (Past Simple).",
    },
    {
      original: "forget",
      corrected: "forgot",
      reason: "Đảm bảo tính song hành của cấu trúc câu (Parallel Structure) khi hai hành động liên kết bởi liên từ 'and' đều đã xảy ra trong quá khứ.",
    }
  ];

  // AI Analysis Handler
  const handleAIAnalysis = () => {
    if (requestCount >= 5) {
      setIsRateLimited(true);
      toast.error("Hạn mức thử nghiệm tạm thời đã hết! Vui lòng đăng nhập hoặc nâng cấp.", {
        duration: 5000,
      });
      return;
    }

    setIsPending(true);
    setIsCompleted(false);
    setActiveTab("input");

    // Simulate API delay
    setTimeout(() => {
      setIsPending(false);
      setIsCompleted(true);
      setRequestCount((prev) => prev + 1);
      setActiveTab("result");
      toast.success("Phân tích AI hoàn thành thành công!");
    }, 1500);
  };

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
                <Link href="#ai-demo">
                  <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/20 transition-all hover:shadow-xl hover:shadow-indigo-600/30 gap-2">
                    Thử AI sửa lỗi ngay <Sparkles className="size-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-muted-foreground/20 hover:bg-muted/40 gap-2">
                    Xem tính năng chính <Play className="size-4 fill-current" />
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
                  <span className="text-xs text-muted-foreground font-mono">Engducation AI engine v1.0</span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="size-3.5" /> AI Analysis Mode
                  </div>
                  <p className="text-sm font-medium text-primary bg-muted/40 p-3 rounded border border-dashed">
                    "I <span className="text-red-500 line-through underline decoration-wavy decoration-red-500">has</span> been learning English since 2 years."
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                    <Check className="size-3.5" /> AI Optimized Output
                  </div>
                  <p className="text-sm font-medium text-emerald-600 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
                    "I <span className="font-bold underline">have</span> been learning English <span className="font-bold underline">for</span> 2 years."
                  </p>
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

        {/* INTERACTIVE AI DEMO SECTION */}
        <section id="ai-demo" className="w-full py-16 md:py-24 container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto flex flex-col items-center space-y-8">
            <div className="text-center flex flex-col items-center justify-center space-y-4 mb-4">
              <Badge variant="outline" className="px-3 py-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                Thử Nghiệm Thực Tế
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
                Trải Nghiệm Ngay Trợ Lý AI Writing
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-[580px]">
                Nhập một câu hoặc đoạn văn tiếng Anh có chứa lỗi sai bên dưới, hệ thống sẽ phân tích lỗi sai và tối ưu lại ngữ pháp của bạn trong nháy mắt.
              </p>
            </div>

            {/* Simulated Rate Limit Alert */}
            {isRateLimited && (
              <Alert variant="destructive" className="w-full border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-4 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Hạn mức thử nghiệm tạm thời đã hết!</AlertTitle>
                <AlertDescription className="text-xs md:text-sm mt-1 opacity-90 leading-relaxed">
                  Để đảm bảo tài nguyên hệ thống, tính năng demo không đăng nhập bị giới hạn tần suất truy cập (tối đa 5 lượt/15 phút). Vui lòng đăng ký tài khoản miễn phí hoặc nâng cấp gói Premium để tiếp tục sử dụng không giới hạn.
                </AlertDescription>
                <div className="mt-3 flex gap-2">
                  <Link href="/login">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold">Đăng ký miễn phí</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setIsRateLimited(false)} className="text-xs">Đóng thông báo</Button>
                </div>
              </Alert>
            )}

            {/* AI Workspace Card */}
            <div className="w-full border rounded-2xl bg-card shadow-2xl p-6 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 bg-muted/40 border-l border-b rounded-bl-lg text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                Công suất sử dụng: {requestCount}/5 lượt thử
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[340px] mb-4">
                  <TabsTrigger value="input">Soạn thảo văn bản</TabsTrigger>
                  <TabsTrigger value="result" disabled={!isCompleted}>Kết quả phân tích</TabsTrigger>
                </TabsList>

                {/* Input Tab */}
                <TabsContent value="input" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Văn bản tiếng Anh đầu vào
                    </label>
                    <Textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="min-h-[200px] resize-none border-dashed p-4 font-medium text-base focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      placeholder="She go to school yesterday and she forget her book..."
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Độ dài: {inputText.length} ký tự
                    </span>
                    <Button 
                      onClick={handleAIAnalysis}
                      disabled={isPending || !inputText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-600/10 transition-all hover:shadow-lg hover:shadow-indigo-600/20"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang phân tích...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Phân tích bằng AI <Sparkles className="size-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Result Tab */}
                <TabsContent value="result" className="space-y-6 mt-0">
                  {isPending ? (
                    <div className="space-y-4 py-4">
                      <Skeleton className="h-5 w-[200px] bg-muted-foreground/10" />
                      <Skeleton className="h-10 w-full bg-muted-foreground/10" />
                      <Skeleton className="h-5 w-[250px] bg-muted-foreground/10" />
                      <Skeleton className="h-24 w-full bg-muted-foreground/10" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Left: Corrected text display */}
                      <div className="p-5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Check className="size-4" /> Bản sửa đổi hoàn hảo
                          </h4>
                          <p className="text-base font-semibold leading-relaxed text-primary">
                            She <span className="bg-emerald-500/20 dark:bg-emerald-500/30 px-1 py-0.5 rounded text-emerald-700 dark:text-emerald-400 underline decoration-2">went</span> to school yesterday and she <span className="bg-emerald-500/20 dark:bg-emerald-500/30 px-1 py-0.5 rounded text-emerald-700 dark:text-emerald-400 underline decoration-2">forgot</span> her book.
                          </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-emerald-500/10 flex items-center justify-between text-xs text-emerald-600 font-medium">
                          <span>Độ chính xác: 100% (Từ hệ thống AI)</span>
                        </div>
                      </div>

                      {/* Right: Detailed explanations */}
                      <div className="flex flex-col space-y-4">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="size-4" /> Báo cáo giải nghĩa chi tiết
                        </h4>
                        <div className="space-y-3">
                          {corrections.map((corr, idx) => (
                            <div key={idx} className="p-4 rounded-lg bg-muted/40 border text-xs leading-relaxed space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-red-500 line-through font-semibold">{corr.original}</span>
                                <ArrowRight className="size-3 text-muted-foreground" />
                                <span className="font-mono text-emerald-600 font-extrabold bg-emerald-500/10 px-1 py-0.2 rounded">{corr.corrected}</span>
                              </div>
                              <p className="text-muted-foreground font-medium">
                                {corr.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
              {/* Card 1: Free */}
              <Card className="bg-card border flex flex-col justify-between p-8 hover:shadow-lg transition-all duration-300">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">Học Viên Tự Do</h3>
                    <p className="text-sm text-muted-foreground">Phù hợp để trải nghiệm các tính năng cốt lõi cơ bản.</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-primary">0đ</span>
                    <span className="text-sm text-muted-foreground">/ tháng</span>
                  </div>
                  <Separator />
                  <ul className="space-y-3.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600" /> Xem các video bài giảng công khai.
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600" /> Làm bài tập Quiz cơ bản theo danh mục.
                    </li>
                    <li className="flex items-center gap-2.5 text-muted-foreground/60">
                      <Lock className="size-4 text-muted-foreground/40" /> Giới hạn AI Assistant (5 lượt/ngày).
                    </li>
                    <li className="flex items-center gap-2.5 text-muted-foreground/60">
                      <Lock className="size-4 text-muted-foreground/40" /> Không có Dashboard đo tiến trình học sâu.
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="w-full mt-8">
                  <Button variant="outline" className="w-full py-6 font-bold border-indigo-600/20 hover:bg-muted/40">
                    Sử dụng miễn phí
                  </Button>
                </Link>
              </Card>

              {/* Card 2: Premium Pro */}
              <Card className="relative bg-card border-2 border-indigo-600 shadow-2xl flex flex-col justify-between p-8 lg:scale-105 z-10 transition-all duration-300">
                <Badge className="absolute -top-3.5 right-6 bg-indigo-600 hover:bg-indigo-600 text-white font-extrabold px-4 py-1 rounded-full uppercase tracking-wider text-xs border-indigo-700">
                  Khuyên Dùng
                </Badge>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                      Premium Pro <Zap className="size-4 fill-amber-400 text-amber-400" />
                    </h3>
                    <p className="text-sm text-muted-foreground">Truy cập toàn diện mọi tính năng học tập tối tân nhất.</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-primary">199.000đ</span>
                    <span className="text-sm text-muted-foreground">/ tháng</span>
                  </div>
                  <Separator />
                  <ul className="space-y-3.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600" /> Xem 100% kho khóa học & video bài giảng chuyên sâu.
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600" /> Luyện tập không giới hạn Quiz trắc nghiệm.
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600" /> Không giới hạn ký tự tương tác với AI Assistant.
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600" /> Dashboard thống kê tiến trình & phát hiện điểm yếu.
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600" /> Tự động mở khóa ngay sau khi thanh toán thành công.
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="w-full mt-8">
                  <Button variant="default" className="w-full py-6 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20">
                    Nâng cấp Premium ngay
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
