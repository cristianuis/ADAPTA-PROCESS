import type { Metadata } from "next";
import { DemoDiagnostico } from "@/components/landing/DemoDiagnostico";
import {
  PortfolioFooter,
  PortfolioHeader,
} from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Pulso operativo",
  description:
    "Descubre en cinco preguntas qué tan dependiente, estructurada y medible es la operación de tu empresa.",
};

export default function DiagnosticoPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e7]">
      <PortfolioHeader />
      <main className="relative overflow-hidden py-14 sm:py-20">
        <div
          className="absolute inset-x-0 top-0 h-[32rem] bg-[#163f8c] sm:h-[36rem] lg:h-[50rem]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-12">
          <div className="py-5 text-white lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2e8d5]">
              Muestra interactiva
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl">
              ¿Tu operación es un sistema o depende de héroes?
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#c3d2e7] sm:text-lg">
              Obtén una lectura inicial sobre documentación, adopción, medición,
              responsables y toma de decisiones.
            </p>
            <div className="mt-8 border-l border-white/25 pl-5">
              <p className="text-sm font-medium">Lo que recibirás</p>
              <ul className="mt-3 space-y-2 text-sm text-[#c3d2e7]">
                <li>Tu perfil operativo inicial</li>
                <li>La principal señal de riesgo</li>
                <li>Un siguiente movimiento recomendado</li>
              </ul>
            </div>
          </div>
          <DemoDiagnostico />
        </div>
      </main>
      <PortfolioFooter />
    </div>
  );
}
