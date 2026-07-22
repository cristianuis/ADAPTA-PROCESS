"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearBenchmark } from "@/lib/actions/benchmarks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function BenchmarkForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [sector, setSector] = useState("");
  const [indicador, setIndicador] = useState("");
  const [p25, setP25] = useState("");
  const [mediana, setMediana] = useState("");
  const [p75, setP75] = useState("");
  const [n, setN] = useState("1");

  function handleSubmit() {
    startTransition(async () => {
      const result = await crearBenchmark({
        sector,
        indicador,
        valorP25: p25 ? Number(p25) : null,
        valorMediana: mediana ? Number(mediana) : null,
        valorP75: p75 ? Number(p75) : null,
        numObservaciones: Number(n) || 1,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Benchmark guardado.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Agregar benchmark</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo benchmark sectorial</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Cifras agregadas y anonimizadas — nunca datos identificables de un cliente específico.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sector">Sector</Label>
              <Input id="sector" value={sector} onChange={(e) => setSector(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="indicador">Indicador</Label>
              <Input id="indicador" value={indicador} onChange={(e) => setIndicador(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p25">Percentil 25</Label>
              <Input id="p25" type="number" value={p25} onChange={(e) => setP25(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mediana">Mediana</Label>
              <Input id="mediana" type="number" value={mediana} onChange={(e) => setMediana(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p75">Percentil 75</Label>
              <Input id="p75" type="number" value={p75} onChange={(e) => setP75(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="n">N.º observaciones</Label>
              <Input id="n" type="number" min={1} value={n} onChange={(e) => setN(e.target.value)} />
            </div>
          </div>
          <Button disabled={isPending || !sector || !indicador} onClick={handleSubmit}>
            Guardar benchmark
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
