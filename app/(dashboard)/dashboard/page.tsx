import { redirect } from "next/navigation";

/** La guía de trabajo es la pantalla de inicio; evita dejar al consultor ante un tablero sin siguiente paso. */
export default function DashboardPage() {
  redirect("/lancelot");
}
