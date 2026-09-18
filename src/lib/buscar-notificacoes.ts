import type { Notificacao } from '@/types/cliente'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'

// `lida` vem como texto ("sim"/"não") no Bubble; aceita boolean por segurança.
function lidaParaBoolean(valor: unknown): boolean {
  if (typeof valor === 'boolean') return valor
  return String(valor ?? '').trim().toLowerCase() === 'sim'
}

export async function buscarNotificacoes(contratoId: string): Promise<Notificacao[]> {
  const url = `${BUBBLE_BASE_URL}/portal-cliente_vistorias`
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
    throw new Error(data.message ?? 'Erro ao buscar notificações')
  }

  const lista: any[] = data.response.notificacoes ?? []
  return lista
    .map((n) => ({
      id: n._id,
      titulo: n.titulo ?? '',
      mensagem: n.mensagem ?? n.descricao ?? '',
      tipo: n.tipo ?? '',
      setor: n.setor ?? '',
      ref: n.ref ?? '',
      lida: lidaParaBoolean(n.lida),
      criada_em_ts: n['Created Date'] ?? 0,
    }))
    .filter((n) => n.id)
    .sort((a, b) => b.criada_em_ts - a.criada_em_ts)
}
