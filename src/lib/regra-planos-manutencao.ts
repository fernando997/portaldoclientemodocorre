import type { ItemListagemPlano } from '@/types/cliente'
import type { BubblePlanoDefinido, BubblePlanoManutencao } from '@/data/bubble-estrutura'

// Mesma regra da tela operacional-consultar_planos-v2 do Bubble (script
// "Consultar Planos", versão 2026-10-14a). Os pendentes não vêm dos
// Plano_definidos gravados: são calculados pelo plano de manutenção da moto.
// Do banco só entram os realizados e os que já têm OS.

// Tolerância do Bubble: um plano vence em km previsto + 500
export const TOLERANCIA_KM = 500

// Unidade CAMPINAS (Codigo CAMP) na tabela `unidades` do Bubble.
export const UNIDADE_CAMPINAS = '1779731986132x182858207994576900'

const LIMITE_POR_PLANO = 1000

// Ordem de checagem igual à da tela operacional
const FAMILIAS_SERVICO = ['LUBRIFICACAO', 'GARANTIA', 'MECANICA', 'OLEO']

const PALAVRAS_MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'a', 'o'])

export type FiltroListagem = 'TODOS' | 'NAO REALIZADO' | 'REALIZADO'

export type TipoSituacao = 'concluida' | 'os' | 'vencida' | 'na-hora' | 'faltam'

interface VeiculoDaRegra {
  km?: number
  grupos?: string
  Unidade?: string
}

interface OrdemServicoDaRegra {
  _id: string
  'numero os'?: number
}

interface EntradaListagem {
  catalogo: BubblePlanoManutencao[]
  definidos: BubblePlanoDefinido[]
  veiculo: VeiculoDaRegra | null
  ordensServico: OrdemServicoDaRegra[]
}

const num = (v: unknown) => (v == null || v === '' ? NaN : Number(v))

const formatarKm = (n: number) => n.toLocaleString('pt-BR')

function semAcento(texto: unknown) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(texto: string) {
  return texto
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((p, i) => (i && PALAVRAS_MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ')
}

// "➡️ REVISÃO MECANICA HONDA previsto para 18,000 km" -> "REVISÃO MECANICA HONDA"
function nomeServico(descricao: string) {
  return descricao
    .replace(/^[^A-Za-zÀ-ÿ0-9]+/, '')
    .replace(/\s*previsto para.*$/i, '')
    .trim()
}

export function nomeExibicao(servico: string) {
  const t = semAcento(servico)
  // COMPLETAR ÓLEO mantém o próprio nome (não vira "Troca de Óleo")
  if (t.startsWith('COMPLETAR')) return titleCase(servico)
  if (t.includes('OLEO') && t.includes('TROCA')) return 'Troca de Óleo'
  return titleCase(servico.replace(/\b\d[\d.,]*\s*km\b/gi, '').replace(/\s+/g, ' ').trim())
}

// Dois planos do mesmo tipo de serviço (ex.: troca de óleo de unidades
// diferentes) não geram o mesmo km duas vezes.
function familiaDoPlano(descricao: unknown, servico: unknown) {
  const t = semAcento(`${descricao ?? ''} ${servico ?? ''}`)
  if (t.includes('COMPLETAR')) return 'COMPLETAR'
  const familia = FAMILIAS_SERVICO.find((f) => t.includes(f))
  if (familia) return familia
  return semAcento(servico) || semAcento(descricao)
}

function kmsDaRegra(kmInicial: number, recorrencia: number, kmMaximo: number) {
  const kms: number[] = []
  if (!(kmInicial > 0) || !(recorrencia > 0) || !(kmMaximo >= kmInicial)) return kms
  for (let km = kmInicial; km <= kmMaximo && kms.length < LIMITE_POR_PLANO; km += recorrencia) kms.push(km)
  return kms
}

// Plano principal: 1º km + n × recorrência. Subplano (ex.: COMPLETAR ÓLEO):
// entre as revisões do pai, pulando os km em que o pai já faz o serviço.
function kmsDoPlano(plano: BubblePlanoManutencao, catalogoPorId: Map<string, BubblePlanoManutencao>) {
  const recorrencia = num(plano.recorrencia)
  const pai = plano.plano_pai ? catalogoPorId.get(plano.plano_pai) : undefined
  if (pai) {
    const paiInicial = num(pai['km primeiro servico'])
    const paiRecorrencia = num(pai.recorrencia)
    const paiMaximo = num(pai['maximo de km'])
    if (paiInicial > 0 && paiRecorrencia > 0 && paiMaximo > 0) {
      const doPai = new Set(kmsDaRegra(paiInicial, paiRecorrencia, paiMaximo))
      const kms: number[] = []
      if (recorrencia > 0) {
        for (let km = paiInicial + recorrencia; km <= paiMaximo && kms.length < LIMITE_POR_PLANO; km += recorrencia) {
          if (!doPai.has(km)) kms.push(km)
        }
      }
      return kms
    }
  }
  return kmsDaRegra(num(plano['km primeiro servico']), recorrencia, num(plano['maximo de km']))
}

// Planos de manutenção que valem para a moto: V2, ativos, do grupo e da
// unidade dela. Sem grupo ou sem unidade, nenhum vale.
function planosDaMoto(catalogo: BubblePlanoManutencao[], veiculo: VeiculoDaRegra | null) {
  const grupo = veiculo?.grupos
  const unidade = veiculo?.Unidade
  if (!grupo || !unidade) return []
  return catalogo.filter((p) => {
    if (p.versao !== 'V2' || p.status !== 'ATIVO') return false
    if (!(p.grupos ?? []).includes(grupo) || !(p.unidades ?? []).includes(unidade)) return false
    const ehCompletar = semAcento(`${p['descrição'] ?? ''} ${p['serviço'] ?? ''}`).includes('COMPLETAR')
    return !ehCompletar || unidade === UNIDADE_CAMPINAS
  })
}

export function montarListagemPlanos({ catalogo, definidos, veiculo, ordensServico }: EntradaListagem) {
  const catalogoPorId = new Map(catalogo.map((p) => [p._id, p]))
  const numeroDaOs = new Map(ordensServico.map((o) => [o._id, o['numero os'] ?? null]))
  const kmMoto = num(veiculo?.km) || 0

  // Histórico: realizados e os que já têm OS
  const doBanco = definidos
    .filter((d) => /^REAL/i.test(String(d.status ?? '').trim()) || !!d.os)
    .map((d) => {
      const plano = d.Plano ? catalogoPorId.get(d.Plano) : undefined
      const descricao = d['descrição'] ?? ''
      const item: ItemListagemPlano = {
        id: d._id,
        km: num(d.km),
        nome: nomeExibicao(nomeServico(descricao)),
        descricao,
        status: /^REAL/i.test(String(d.status ?? '').trim()) ? 'REALIZADO' : 'NAO REALIZADO',
        os_id: d.os || null,
        numero_os: d.os ? (numeroDaOs.get(d.os) ?? null) : null,
        calculado: false,
      }
      // Registro de um plano antigo que virou o plano atual também conta como dele
      const planoIds = [d.Plano, plano?.plano_consolidado, plano?.substituido_por].filter(Boolean)
      const familia = familiaDoPlano(plano?.['descrição'] || descricao, plano?.['serviço'])
      return { item, planoIds, familia }
    })

  const calculados: ItemListagemPlano[] = []
  for (const plano of planosDaMoto(catalogo, veiculo)) {
    const familia = familiaDoPlano(plano['descrição'], plano['serviço'])
    const nome = String(plano['serviço'] || plano['descrição'] || '').trim()
    for (const km of kmsDoPlano(plano, catalogoPorId)) {
      const jaNoBanco = doBanco.some(
        (b) => b.item.km === km && (b.planoIds.includes(plano._id) || b.familia === familia)
      )
      if (jaNoBanco) continue
      calculados.push({
        id: `calc|${plano._id}|${km}`,
        km,
        nome: nomeExibicao(nome),
        descricao: `➡️ ${nome} previsto para ${formatarKm(km)} km`,
        status: 'NAO REALIZADO',
        os_id: null,
        numero_os: null,
        calculado: true,
      })
    }
  }

  const ordenados = [...doBanco.map((b) => b.item), ...calculados].sort((a, b) => a.km - b.km)

  // Mesmo serviço no mesmo km aparece uma vez só (prefere o que já tem OS)
  const chave = (i: ItemListagemPlano) => `${semAcento(i.descricao || i.nome)}|${i.km}`
  const escolhidos = new Map<string, ItemListagemPlano>()
  for (const item of ordenados) {
    const atual = escolhidos.get(chave(item))
    if (!atual || (!atual.os_id && item.os_id)) escolhidos.set(chave(item), item)
  }
  const itens = ordenados.filter((i) => escolhidos.get(chave(i)) === i)

  return { kmMoto, itens }
}

export function filtrarListagem(itens: ItemListagemPlano[], kmMoto: number, filtro: FiltroListagem) {
  // Realizados e com OS aparecem sempre; pendentes vencidos além da tolerância somem
  let lista = itens.filter((i) => i.status === 'REALIZADO' || i.os_id || i.km + TOLERANCIA_KM >= kmMoto)
  if (filtro === 'NAO REALIZADO') lista = lista.filter((i) => i.status !== 'REALIZADO')
  if (filtro === 'REALIZADO') lista = lista.filter((i) => i.status === 'REALIZADO')
  const pendentes = lista.filter((i) => i.status !== 'REALIZADO')
  return { itens: lista, pendentes: pendentes.length, proxima: pendentes[0] ?? null }
}

export function situacaoDoPlano(item: ItemListagemPlano, kmMoto: number): { tipo: TipoSituacao; texto: string } {
  if (item.status === 'REALIZADO') return { tipo: 'concluida', texto: 'Concluída' }
  if (item.os_id) {
    return { tipo: 'os', texto: item.numero_os != null ? `OS ${item.numero_os} gerada` : 'OS gerada' }
  }
  if (kmMoto > item.km + TOLERANCIA_KM) {
    return { tipo: 'vencida', texto: `Vencida há ${formatarKm(kmMoto - (item.km + TOLERANCIA_KM))} km` }
  }
  if (kmMoto >= item.km) return { tipo: 'na-hora', texto: 'Na hora de fazer' }
  return { tipo: 'faltam', texto: `Faltam ${formatarKm(item.km - kmMoto)} km` }
}
