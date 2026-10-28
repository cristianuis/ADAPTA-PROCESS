"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("password-reset") === "success") {
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    if (params.get("error") !== "auth-callback") return;
    toast.error("El acceso no pudo validarse. Inicia sesión o solicita un nuevo restablecimiento.");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

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
    router.push("/lancelot");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresar a NEXUS IA PROCESS</CardTitle>
        <CardDescription>
          Acceso privado del consultor administrador.
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
          <Link href="/recuperar-contrasena" className="text-center text-sm text-primary underline underline-offset-4">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            No hay registro público ni portal de cliente habilitado todavía.
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
