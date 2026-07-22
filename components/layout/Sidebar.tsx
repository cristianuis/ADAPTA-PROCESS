import Link from "next/link";
import { LayoutDashboard, Users, FolderKanban, UserCog, Library } from "lucide-react";

const NAV = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/perfil", label: "Perfil", icon: UserCog },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold tracking-tight">ADAPTA OS</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
