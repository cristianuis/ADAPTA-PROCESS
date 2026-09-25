import { esAdministradorActual, getConsultorActual } from "@/lib/actions/consultores";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const esAdministrador = await esAdministradorActual();
  if (!esAdministrador) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
        <section className="rounded-xl border bg-card p-6">
          <h1 className="text-xl font-semibold">Cuenta pendiente de autorización</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta cuenta puede iniciar sesión, pero el propietario de NEXUS todavía no le ha habilitado el acceso a la plataforma.
          </p>
        </section>
      </main>
    );
  }

  const { consultor, user } = await getConsultorActual();

  const brandStyle = consultor
    ? ({
        "--primary": consultor.color_primario,
        "--ring": consultor.color_primario,
        "--sidebar": consultor.color_primario,
        "--secondary": consultor.color_secundario,
        "--sidebar-primary": consultor.color_secundario,
      } as React.CSSProperties)
    : undefined;

  return (
    <div className="flex min-h-screen w-full" style={brandStyle}>
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar nombreConsultor={consultor?.nombre ?? user.email ?? "Consultor"} />
        <main className="min-w-0 flex-1 bg-background p-4 md:p-8">
          {!consultor && (
            <div className="mb-6 rounded-md border border-secondary bg-secondary/20 px-4 py-3 text-sm text-foreground">
              Completa tu perfil de consultor para personalizar la marca de tus entregables.{" "}
              <a href="/perfil" className="font-medium underline underline-offset-4">
                Ir a Perfil
              </a>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
