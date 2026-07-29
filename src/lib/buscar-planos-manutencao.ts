import type { PlanoManutencao } from '@/types/cliente'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'

export async function buscarPlanosManutencao(contratoId: string): Promise<PlanoManutencao[]> {
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
    throw new Error(data.message ?? 'Erro ao buscar planos de manutenção')
  }

  console.log('[PLANOS] response completo:', data.response)

  const catalogo: any[] = data.response.plano_manutencao ?? []
  const nomePlano = (id: string) => catalogo.find((p) => p._id === id)?.['descrição'] ?? ''

  return (data.response.plano_definido ?? []).map((p: any) => ({
    id: p._id,
    data: p.data ? new Date(p.data).toISOString().split('T')[0] : '',
    descricao: p['descrição'] ?? '',
    km: p.km ?? 0,
    status: p.status ?? '',
    plano_nome: nomePlano(p.Plano),
  }))
}
