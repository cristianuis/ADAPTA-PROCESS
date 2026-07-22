// Rate limiter en memoria, por proceso — suficiente para un solo consultor/instancia.
// Limitación conocida: en un despliegue serverless con múltiples instancias (Vercel),
// cada instancia tiene su propio contador, así que el límite real efectivo es
// "N por instancia" no "N global". Para un límite estricto multi-instancia se
// necesitaría un store compartido (Redis/Upstash). Documentado en el informe de auditoría.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

/**
 * Límite simple de tipo "ventana fija": `limite` solicitudes por `ventanaMs` por clave.
 * La clave debe combinar el endpoint + identidad del consultor (ej. `analizar-entrevista:${consultorId}`)
 * para que un consultor no pueda agotar el límite de otro ni de otro endpoint.
 */
export function verificarLimite(clave: string, limite = 10, ventanaMs = 60_000): RateLimitResult {
  const ahora = Date.now();
  const bucket = buckets.get(clave);

  if (!bucket || ahora >= bucket.resetAt) {
    buckets.set(clave, { count: 1, resetAt: ahora + ventanaMs });
    return { ok: true };
  }

  if (bucket.count >= limite) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - ahora) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}
