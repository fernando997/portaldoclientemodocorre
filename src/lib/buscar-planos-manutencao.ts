import type { PlanoManutencao } from '@/types/cliente'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'
import { timestampParaDataLocal } from '@/lib/data'

// Unidade CAMPINAS (Codigo CAMP) na tabela `unidades` do Bubble.
const UNIDADE_CAMPINAS = '1779731986132x182858207994576900'

// Planos que só devem aparecer para motos locadas em Campinas. O catálogo do
// Bubble lista COMPLETAR ÓLEO em todas as unidades, então a restrição é
// aplicada aqui, comparando com a unidade do veículo do contrato.
const PLANOS_SO_CAMPINAS = ['COMPLETAR ÓLEO']

function normalizar(texto: string) {
  return texto.trim().toUpperCase()
}

// Casa tanto pelo nome do plano no catálogo quanto pela descrição do item
// gerado, que embute o nome do serviço ("➡️ COMPLETAR ÓLEO previsto para ...").
function ehPlanoSoCampinas(planoNome: string, descricao: string) {
  return PLANOS_SO_CAMPINAS.some(
    (nome) => normalizar(planoNome) === nome || normalizar(descricao).includes(nome)
  )
}

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

  const catalogo: any[] = data.response.plano_manutencao ?? []
  const nomePlano = (id: string) => catalogo.find((p) => p._id === id)?.['descrição'] ?? ''

  // Unidade desconhecida esconde os planos restritos, em vez de liberá-los
  const ehCampinas = data.response.veiculo?.Unidade === UNIDADE_CAMPINAS

  return (data.response.plano_definido ?? [])
    .map((p: any) => ({
      id: p._id,
      data: p['Created Date'] ? timestampParaDataLocal(p['Created Date']) : '',
      descricao: p['descrição'] ?? '',
      km: p.km ?? 0,
      status: p.status ?? '',
      plano_nome: nomePlano(p.Plano),
    }))
    .filter((p: PlanoManutencao) => ehCampinas || !ehPlanoSoCampinas(p.plano_nome, p.descricao))
}
