import type { PlanoManutencao } from '@/types/cliente'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'
import { timestampParaDataLocal } from '@/lib/data'
import { temConteudo } from '@/lib/mapear-cliente'
import { montarListagemPlanos, UNIDADE_CAMPINAS } from '@/lib/regra-planos-manutencao'

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

const TAMANHO_PAGINA_PLANOS = 50
const MAX_PAGINAS_PLANOS = 10

async function buscarPaginaPlanos(contratoId: string, cursor: number): Promise<any> {
  const url = `${BUBBLE_BASE_URL}/portal-cliente_planos`
  const body = { contrato: contratoId, cursor, apikey: BUBBLE_API_KEY }
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
  return data.response
}

// Listagem da tela "Planos de manutenção": realizados + previstos pela regra
// da tela operacional-consultar_planos-v2, para a moto da placa do contrato.
// O Bubble devolve no máximo 50 itens por lista, então os realizados vêm em
// páginas de 50 (cursor 1, 51, 101...) até vir uma página incompleta.
export async function buscarListagemPlanos(contratoId: string) {
  const primeira = await buscarPaginaPlanos(contratoId, 1)
  const realizados: any[] = [...(primeira.plano_definido ?? [])]
  let tamanhoUltima = realizados.length
  for (let pagina = 1; tamanhoUltima === TAMANHO_PAGINA_PLANOS && pagina < MAX_PAGINAS_PLANOS; pagina++) {
    const seguinte = await buscarPaginaPlanos(contratoId, 1 + pagina * TAMANHO_PAGINA_PLANOS)
    const lista: any[] = seguinte.plano_definido ?? []
    realizados.push(...lista)
    tamanhoUltima = lista.length
  }

  return montarListagemPlanos({
    catalogo: primeira.plano_manutencao ?? [],
    definidos: [...realizados, ...(primeira.plano_definido_os ?? [])],
    veiculo: temConteudo(primeira.veiculo) ? primeira.veiculo : null,
    ordensServico: primeira.ordens ?? [],
  })
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
