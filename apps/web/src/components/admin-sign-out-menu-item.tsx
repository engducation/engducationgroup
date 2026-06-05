"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function AdminSignOutMenuItem() {
  const router = useRouter();

  return (
    <DropdownMenuItem
      variant="destructive"
      className="gap-2 py-2"
      onClick={() => {
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/");
              router.refresh();
            },
          },
        });
      }}
    >
      <LogOut className="size-4" />
      Đăng xuất
    </DropdownMenuItem>
  );
}
