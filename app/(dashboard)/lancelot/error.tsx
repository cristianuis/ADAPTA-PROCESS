"use client";

import { Button } from "@/components/ui/button";

export default function Error({ unstable_retry }: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section role="alert" className="mx-auto max-w-xl rounded-xl border bg-card p-6">
      <h1 className="text-xl font-semibold">No pudimos cargar tu siguiente paso</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        El avance de tus intervenciones no está disponible en este momento. Ningún dato se ha marcado como incompleto.
      </p>
      <Button className="mt-5" onClick={() => unstable_retry()}>Volver a intentar</Button>
    </section>
  );
}
