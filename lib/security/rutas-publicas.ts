const RUTAS_PUBLICAS = ["/login", "/encuesta", "/herramientas", "/diagnostico", "/consultoria", "/opengraph-image"];

export function esRutaPublica(pathname: string): boolean {
  return pathname === "/" || RUTAS_PUBLICAS.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}
