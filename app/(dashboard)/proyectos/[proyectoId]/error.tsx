"use client";

import { Button } from "@/components/ui/button";

export default function ErrorProyecto({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <div className="max-w-xl space-y-3 rounded-md border border-destructive/30 bg-card p-6">
      <h1 className="text-lg font-semibold">No pudimos cargar esta parte de la intervención</h1>
      <p className="text-sm text-muted-foreground">No se han sustituido los datos por una lista vacía. Reintenta; si persiste, revisa la conexión o avisa al administrador.</p>
      <Button onClick={() => unstable_retry()}>Reintentar</Button>
    </div>
  );
}
