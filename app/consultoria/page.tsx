import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Search,
  Waypoints,
} from "lucide-react";
import { ConsultoriaForm } from "@/components/landing/ConsultoriaForm";
import {
  PortfolioFooter,
  PortfolioHeader,
} from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Consultoría especializada",
  description:
    "Comparte el reto operativo de tu empresa y solicita una lectura especializada de procesos.",
};

type SearchParams = Promise<{
  titulo?: string | string[];
  descripcion?: string | string[];
  empresa?: string | string[];
}>;

function valorInicial(
  valor: string | string[] | undefined,
  limite: number
): string {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto?.trim().slice(0, limite) ?? "";
}

export default async function ConsultoriaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const whatsappNumber =
    process.env.WHATSAPP_NUMBER ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    "";

  return (
    <div className="min-h-screen bg-[#f5f1e7]">
      <PortfolioHeader />
      <main>
        <section className="relative overflow-hidden py-14 sm:py-20">
          <div
            className="absolute inset-x-0 top-0 h-[56rem] bg-[#163f8c]"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:px-12">
            <div className="py-6 text-white lg:sticky lg:top-28">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f2e8d5]">
                <span className="h-px w-8 bg-[#f2e8d5]/70" />
                Consultoría especializada
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl">
                Convierte un problema operativo en una decisión clara.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#c3d2e7] sm:text-lg">
                Describe el reto con tus palabras. Recibiré el contexto organizado
                en WhatsApp para comenzar la conversación desde el problema real.
              </p>

              <div className="mt-10 grid gap-3">
                {[
                  [Search, "Entender", "Leemos el contexto antes de proponer."],
                  [Waypoints, "Priorizar", "Identificamos la primera decisión útil."],
                  [Check, "Avanzar", "Definimos si una intervención tiene sentido."],
                ].map(([Icon, titulo, descripcion]) => {
                  const StepIcon = Icon as typeof Search;
                  return (
                    <div
                      key={titulo as string}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f2e8d5]/10 text-[#f2e8d5]">
                        <StepIcon className="size-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {titulo as string}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[#b5c5db]">
                          {descripcion as string}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <ConsultoriaForm
              whatsappNumber={whatsappNumber}
              initialValues={{
                titulo: valorInicial(query.titulo, 120),
                descripcion: valorInicial(query.descripcion, 1000),
                empresa: valorInicial(query.empresa, 140),
              }}
            />
          </div>
        </section>

        <section className="border-t border-[#163f8c]/10 bg-[#f2e8d5] py-16 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-[#315da8]">
                <LockKeyhole className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Acceso de empresas
                </p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#163f8c] sm:text-4xl">
                ¿Tu empresa ya tiene acceso?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#53647d]">
                Ingresa con la cuenta que te fue asignada. No existe registro
                público: únicamente el superadministrador puede crear o invitar
                usuarios.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#0a1c40] px-7 text-sm font-semibold text-white hover:bg-[#163f8c]"
            >
              Ingresar a mi empresa
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <PortfolioFooter />
    </div>
  );
}
