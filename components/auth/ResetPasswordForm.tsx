"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmacion) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setCargando(false);
      toast.error("El enlace pudo vencer o ya fue utilizado. Solicita otro restablecimiento.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?password-reset=success");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crea una contraseña nueva</CardTitle>
        <CardDescription>Usa al menos 12 caracteres. Después podrás iniciar sesión con ella.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirma la contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={cargando}>
            {cargando ? "Guardando…" : "Guardar contraseña"}
          </Button>
          <Link href="/login" className="text-center text-sm text-muted-foreground underline underline-offset-4">
            Volver a iniciar sesión
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
