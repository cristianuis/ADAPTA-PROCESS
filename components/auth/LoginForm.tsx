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

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);

    if (error) {
      toast.error("Credenciales no válidas o usuario sin acceso.");
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error("Escribe tu correo primero.");
      return;
    }

    setCargando(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setCargando(false);

    if (error) {
      toast.error("Este correo no tiene acceso asignado.");
      return;
    }
    toast.success("Revisa tu correo — te enviamos un enlace de acceso.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresar a mi empresa</CardTitle>
        <CardDescription>
          Acceso privado para el superadministrador y empresas invitadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={cargando}>
            Iniciar sesión
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={cargando}
            onClick={handleMagicLink}
          >
            Enviarme un enlace mágico
          </Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            No hay registro público. Solo el superadministrador puede crear o invitar usuarios.
          </p>
          <Link
            href="/"
            className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Volver al portafolio
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
