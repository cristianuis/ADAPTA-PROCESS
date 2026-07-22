"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export function Topbar({ nombreConsultor }: { nombreConsultor: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  const inicial = nombreConsultor.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <span className="text-sm font-medium text-muted-foreground md:hidden">ADAPTA OS</span>
      <div className="ml-auto flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {inicial}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">{nombreConsultor}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
