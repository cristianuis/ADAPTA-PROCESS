"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { SPACING_SCALE, TYPE_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
        aria-label="Abrir navegación"
      >
        <Menu className="size-5" />
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/35 md:hidden" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col bg-sidebar text-sidebar-foreground shadow-xl outline-none md:hidden">
          <div className="flex min-h-16 items-center justify-between border-b border-sidebar-border px-4">
            <DialogPrimitive.Title className={TYPE_SCALE.h2}>Lancelot</DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                />
              }
              aria-label="Cerrar navegación"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <nav className={cn("flex flex-col p-3", SPACING_SCALE.xs)} aria-label="Navegación principal">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const activo = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

              return (
                <DialogPrimitive.Close
                  key={href}
                  render={
                    <Link
                      href={href}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-md px-3 text-sm font-medium",
                        SPACING_SCALE.md,
                        activo
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    />
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </DialogPrimitive.Close>
              );
            })}
          </nav>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
