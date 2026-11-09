import { timestampParaDataLocal } from '@/lib/data'

const MS_POR_DIA = 86_400_000

// Diferença em dias de calendário entre duas datas YYYY-MM-DD. A conta é feita
// em UTC de propósito: as duas pontas já são dias de calendário, então o UTC
// serve só de régua e nenhum horário de verão entra no meio.
function diferencaEmDias(de: string, ate: string): number {
  const [a1, m1, d1] = de.split('-').map(Number)
  const [a2, m2, d2] = ate.split('-').map(Number)
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / MS_POR_DIA)
}

// O dia de hoje no fuso de São Paulo, e não no do aparelho: o prazo é o mesmo
// para todos os clientes, então um celular com fuso errado não pode ver outro
// número de dias.
export function hojeNoBrasil(): string {
  return timestampParaDataLocal(Date.now())
}

// Dias que ainda faltam, contando o dia de hoje: 1 significa que hoje é o
// último dia e 0 que o prazo já venceu. `maximo` evita prometer mais dias do
// que o combinado quando a contagem aparece antes de começar.
export function diasRestantes(ultimoDia: string, hoje = hojeNoBrasil(), maximo?: number): number {
  const dias = diferencaEmDias(hoje, ultimoDia) + 1
  const limitado = maximo === undefined ? dias : Math.min(dias, maximo)
  return Math.max(limitado, 0)
}

// 2026-11-12 -> 12/11, o formato que o cliente lê no resto do portal.
export function formatarDiaMes(dataISO: string): string {
  const [, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}`
}
