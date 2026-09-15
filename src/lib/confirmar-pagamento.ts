import type { Parcela } from '@/types/cliente'
import { resolverStatusParcela } from '@/utils/parcela'

// Clientes vinham pagando a próxima parcela em vez da atual. Antes de abrir
// qualquer pagamento, avisa se existe parcela vencida mais antiga que a
// escolhida e deixa o cliente desistir. Retorna true se o pagamento pode seguir.
//
// Parcelas pagas passam direto: nelas o link é o comprovante, não um pagamento.
export function confirmarPagamentoParcela(parcelas: Parcela[], escolhida: Parcela): boolean {
  const statusEscolhida = resolverStatusParcela(escolhida.status, escolhida.vencimento)
  if (statusEscolhida !== 'atrasada' && statusEscolhida !== 'a_vencer') return true

  const temVencidaAnterior = parcelas.some(
    (p) => resolverStatusParcela(p.status, p.vencimento) === 'atrasada' && p.vencimento < escolhida.vencimento
  )
  if (!temVencidaAnterior) return true

  return confirm(
    'Atenção: existe uma parcela vencida antes desta que você pretende pagar!\n\nDeseja continuar mesmo assim?'
  )
}
