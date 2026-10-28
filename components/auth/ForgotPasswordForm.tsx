"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCargando(true);
    try {
      const redirect = new URL("/auth/callback", window.location.origin);
      redirect.searchParams.set("next", "/restablecer-contrasena");
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect.toString() });
      if (error) throw error;
      setEnviado(true);
    } catch {
      toast.error("No se pudo solicitar el restablecimiento. Verifica la conexión e inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restablecer contraseña</CardTitle>
        <CardDescription>
          {enviado
            ? "Si este correo tiene acceso a NEXUS, recibirás instrucciones para crear una contraseña nueva. Revisa también spam."
            : "Escribe el correo de tu cuenta. Te enviaremos instrucciones para crear una contraseña nueva."}
        </CardDescription>
      </CardHeader>
      {!enviado && (
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="recovery-email">Correo</Label>
              <Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <Button type="submit" disabled={cargando}>{cargando ? "Enviando…" : "Enviar instrucciones"}</Button>
          </form>
        </CardContent>
      )}
      <CardContent className="pt-0">
        <Link href="/login" className="text-sm text-primary underline underline-offset-4">Volver a iniciar sesión</Link>
      </CardContent>
    </Card>
  );
}
