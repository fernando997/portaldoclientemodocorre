import { semAcento } from '@/lib/regra-planos-manutencao'

// Quais OS dão direito à fila de espera da base.
//
// "TROCA DE ÓLEO" não é option set no Bubble: é texto livre e inconsistente no
// catálogo de planos — "TROCAS DE ÓLEO PERIÓDICAS", "TROCA DE ÓLEO SUZUKI DK",
// "TROCA DE ÓLEO " (com espaço no fim), "TROCAR ÓLEO DE MOTOR" — e sempre com Ó
// acentuado. Daí a comparação passar por semAcento() em vez de igualdade.
//
// COMPLETAR ÓLEO é serviço vizinho, só existe em Campinas e NÃO dá direito à
// fila, então é excluído explicitamente.

export interface OsCandidata {
  id: string
  numero: number | null
  // Descrição do plano_definido ligado à OS, ex.:
  // "➡️ TROCAS DE ÓLEO PERIÓDICAS previsto para 42.000 km"
  servico: string
  // Status do plano_definido: SUBSTITUIDA e REALIZADO não dão direito à fila
  planoStatus: string
  data: string
}

export function ehTrocaDeOleo(descricao: string): boolean {
  const t = semAcento(descricao)
  if (t.includes('COMPLETAR')) return false
  return t.includes('TROCA') && t.includes('OLEO')
}

// Plano substituído por outro, ou já realizado, não vale — mesma exclusão que o
// endpoint portal-cliente_planos faz na listagem de planos de manutenção.
const PLANO_NAO_VALE = ['SUBSTITUIDA', 'REALIZADO']

// A primeira OS de troca de óleo da lista que o Bubble já devolve ordenada por
// data. Sem nenhuma, a fila não é oferecida.
export function osDeOleoElegivel(candidatas: OsCandidata[]): OsCandidata | null {
  return (
    candidatas.find(
      (os) => ehTrocaDeOleo(os.servico) && !PLANO_NAO_VALE.includes(semAcento(os.planoStatus))
    ) ?? null
  )
}
