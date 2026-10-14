import type { Ticket } from '@/types/cliente'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'

export async function buscarTickets(contratoId: string): Promise<Ticket[]> {
  const url = `${BUBBLE_BASE_URL}/portal-cliente_tickets`
  const body = { contrato: contratoId, apikey: BUBBLE_API_KEY }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Resposta inválida')
  }
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message ?? 'Erro ao buscar tickets')
  }

  return (data.response.atendimentos ?? [])
    .map((t: any) => ({
      id: t._id,
      protocolo: t.protocolo ?? '',
      assunto: t.assunto_principal ?? '',
      canal: t.canal ?? '',
      status: t.status ?? '',
      desfecho: t.desfecho ?? '',
      retorno_obs: t.retorno_obs ?? '',
      abertura_ts: t.data_inicio ?? t['Created Date'] ?? 0,
      encerramento_ts: t.data_final ?? null,
      retorno_em_ts: t.retorno_em ?? null,
    }))
    .filter((t: Ticket) => t.id)
    .sort((a: Ticket, b: Ticket) => b.abertura_ts - a.abertura_ts)
}
