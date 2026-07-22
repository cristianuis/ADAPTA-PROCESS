"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registrarMedicion } from "@/lib/actions/mediciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function RegistrarMedicionForm({ indicadorId }: { indicadorId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [valor, setValor] = useState("");
  const [observaciones, setObservaciones] = useState("");

  function handleSubmit() {
    startTransition(async () => {
      const result = await registrarMedicion({ indicadorId, periodo, valor: Number(valor), observaciones });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Medición registrada.");
      setPeriodo("");
      setValor("");
      setObservaciones("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Registrar medición</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva medición</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="periodo">Periodo</Label>
            <Input id="periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="valor">Valor</Label>
            <Input id="valor" type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
          <Button disabled={isPending || !periodo || !valor} onClick={handleSubmit}>
            Guardar medición
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
