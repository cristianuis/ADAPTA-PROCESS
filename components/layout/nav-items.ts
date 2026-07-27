import { FolderKanban, LayoutDashboard, Library, UserCog, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/perfil", label: "Perfil", icon: UserCog },
] as const;
