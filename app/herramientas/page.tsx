import type { Metadata } from "next";
import {
  AdaptaToolCard,
  PortfolioFooter,
  PortfolioHeader,
} from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Herramientas",
  description:
    "Herramientas digitales creadas por Cristian Alfonso para diagnosticar, estructurar y mejorar procesos empresariales.",
};

export default function HerramientasPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e7]">
      <PortfolioHeader />
      <main>
        <section className="border-b border-[#173c2a]/10 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6c8120]">
              Laboratorio de herramientas
            </p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#173c2a] sm:text-7xl">
              Sistemas creados para que la mejora no dependa de la memoria.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#52645a]">
              Cada herramienta nace de una necesidad metodológica concreta:
              capturar evidencia, guiar decisiones y dejar trazabilidad.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <AdaptaToolCard compact />
          </div>
        </section>
      </main>
      <PortfolioFooter />
    </div>
  );
}
