import { FolderKanban, LayoutDashboard, Library, Sparkles, UserCog, UserRoundSearch, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/lancelot", label: "Lancelot", icon: Sparkles },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/prospectos", label: "Prospectos", icon: UserRoundSearch },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/perfil", label: "Perfil", icon: UserCog },
] as const;
