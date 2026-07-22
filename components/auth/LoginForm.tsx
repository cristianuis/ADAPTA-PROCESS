"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Modo = "login" | "registro";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);

    const { error } =
      modo === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setCargando(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (modo === "registro") {
      toast.success("Cuenta creada. Completa tu perfil de consultor.");
    }

    router.refresh();
    router.push("/");
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error("Escribe tu email primero.");
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setCargando(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Revisa tu correo — te enviamos un enlace de acceso.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ADAPTA OS</CardTitle>
        <CardDescription>
          {modo === "login" ? "Ingresa a tu cuenta de consultor." : "Crea tu cuenta de consultor."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={cargando}>
            {modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={cargando} onClick={handleMagicLink}>
            Enviarme un enlace mágico
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={() => setModo(modo === "login" ? "registro" : "login")}
          >
            {modo === "login" ? "¿No tienes cuenta? Crea una" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
