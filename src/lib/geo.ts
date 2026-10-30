// Distância entre dois pontos na superfície da Terra, usada para conferir se o
// cliente está de fato na base do contrato antes de entrar na fila de óleo.

const RAIO_TERRA_M = 6_371_000

export interface Ponto {
  lat: number
  long: number
}

const emRadianos = (graus: number) => (graus * Math.PI) / 180

// Haversine. O `Math.min(1, ...)` protege do caso em que erro de ponto
// flutuante empurra o argumento do asin um fio acima de 1 (pontos idênticos).
export function distanciaEmMetros(a: Ponto, b: Ponto): number {
  const dLat = emRadianos(b.lat - a.lat)
  const dLong = emRadianos(b.long - a.long)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(emRadianos(a.lat)) * Math.cos(emRadianos(b.lat)) * Math.sin(dLong / 2) ** 2
  return 2 * RAIO_TERRA_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Base sem coordenada cadastrada esconde a fila, em vez de liberá-la por engano:
// o Bubble devolve 0 para campo numérico vazio, e 0,0 é um ponto no Atlântico.
export function pontoValido(p: { lat?: unknown; long?: unknown } | null | undefined): p is Ponto {
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v !== 0
  return !!p && num(p.lat) && num(p.long)
}

export function dentroDoRaio(cliente: Ponto, base: Ponto, raioMetros: number): boolean {
  return distanciaEmMetros(cliente, base) <= raioMetros
}
