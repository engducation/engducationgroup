"use client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
          <span className="flex items-center gap-1 font-extrabold text-indigo-600 dark:text-indigo-400">
            Engducation <span className="text-sky-400">❄️</span>
          </span>
        </Link>

        {/* Center: NavigationMenu */}
        <nav className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-8">
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/#features" />}
                  className="text-sm font-semibold text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-transparent p-0 hover:bg-transparent"
                >
                  Tính năng
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/#ai-demo" />}
                  className="text-sm font-semibold text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-transparent p-0 hover:bg-transparent"
                >
                  Trải nghiệm AI
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/#pricing" />}
                  className="text-sm font-semibold text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-transparent p-0 hover:bg-transparent"
                >
                  Bảng giá
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/#roadmap" />}
                  className="text-sm font-semibold text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-transparent p-0 hover:bg-transparent"
                >
                  Lộ trình học
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          {session ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-sm font-semibold hover:bg-muted/60">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="default" className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 transition-all hover:shadow-lg hover:shadow-indigo-600/20 rounded-md">
                  Bắt đầu miễn phí
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
