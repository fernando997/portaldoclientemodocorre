import type { StatusParcela } from '@/types/cliente'

/**
 * Resolve o status real de uma parcela.
 *
 * No banco de dados, parcelas em aberto chegam com status 'GERADO'.
 * O status 'atrasada' ou 'a_vencer' é calculado aqui comparando
 * o vencimento com a data de hoje.
 *
 * Regras:
 *  - 'GERADO' + vencimento < hoje  → 'atrasada'
 *  - 'GERADO' + vencimento >= hoje → 'a_vencer'
 *  - qualquer outro status (ex: 'PAGO', 'paga') → 'paga'
 */
export function resolverStatusParcela(status: string, vencimento: string): StatusParcela | null {
  const s = status.toUpperCase()

  if (s === 'GERADO') {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataVenc = new Date(vencimento + 'T00:00:00')
    return dataVenc < hoje ? 'atrasada' : 'a_vencer'
  }

  if (s === 'PAGO') return 'paga'

  return null
}
