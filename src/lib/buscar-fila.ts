import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'
import { temConteudo } from '@/lib/mapear-cliente'
import { osDeOleoElegivel, type OsCandidata } from '@/lib/fila-oleo'

// Fila de espera de troca de óleo da base (tabela `oficina_fila_espera` do
// Bubble, a mesma que o totem da base alimenta).

// Raio usado quando a base não tem `raio_metros` preenchido. Coordenada
// ausente esconde a fila (ver pontoValido em @/lib/geo), mas raio ausente só
// cai no padrão — não é motivo para bloquear o cliente.
export const RAIO_PADRAO_METROS = 150

export interface EntradaFila {
  id: string
  status: string
  entrouEmTs: number
  chamadoEmTs: number | null
  chamadoVezes: number
  numeroOs: number | null
  placa: string
}

export interface BaseDaFila {
  id: string
  nome: string
  lat: number
  long: number
  raioMetros: number
}

export interface StatusFila {
  entrada: EntradaFila | null
  posicao: number
  total: number
  base: BaseDaFila | null
  osElegivel: OsCandidata | null
}

// Datas do Bubble chegam como epoch em ms em alguns workflows e como ISO em
// outros; normaliza para número para que ordenação e subtração não virem NaN.
function paraTs(valor: unknown): number {
  if (typeof valor === 'number') return valor
  if (typeof valor === 'string') return Date.parse(valor) || 0
  return 0
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

async function chamar(endpoint: string, body: object, oQue: string): Promise<any> {
  const res = await fetch(`${BUBBLE_BASE_URL}/${endpoint}`, {
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
    throw new Error(data.message ?? `Erro ao ${oQue}`)
  }
  return data.response ?? {}
}

function mapearEntrada(e: any): EntradaFila | null {
  if (!temConteudo(e) || !e._id) return null
  return {
    id: e._id,
    status: String(e.status ?? '').trim().toUpperCase(),
    entrouEmTs: paraTs(e['entrou em'] ?? e['Created Date']),
    chamadoEmTs: e['chamado em'] ? paraTs(e['chamado em']) : null,
    chamadoVezes: num(e['chamado vezes']),
    numeroOs: e['numero os'] ?? null,
    placa: e.placa ?? '',
  }
}

function mapearBase(u: any): BaseDaFila | null {
  if (!temConteudo(u) || !u._id) return null
  return {
    id: u._id,
    nome: u['Nome Unidade'] ?? '',
    lat: num(u.lat),
    long: num(u.long),
    raioMetros: num(u.raio_metros) || RAIO_PADRAO_METROS,
  }
}

// Junta cada OS ao plano de manutenção ligado a ela, porque o tipo de serviço
// só é legível por `os -> plano_mn -> descrição`. Atenção: o nome do campo na
// Data API é `plano_mn` com underscore, diferente de `numero os` e
// `status da os`, que usam espaço.
function mapearCandidatas(ordens: any[], planos: any[]): OsCandidata[] {
  const planoPorId = new Map<string, { descricao: string; status: string }>(
    planos
      .filter((p) => p?._id)
      .map((p) => [p._id, { descricao: p['descrição'] ?? '', status: p.status ?? '' }])
  )
  return ordens
    .filter((o) => o?._id)
    .map((o) => {
      const plano = planoPorId.get(o.plano_mn)
      return {
        id: o._id,
        numero: o['numero os'] ?? null,
        servico: plano?.descricao ?? '',
        planoStatus: plano?.status ?? '',
        data: o['data e hora'] ?? '',
      }
    })
}

export async function buscarStatusFila(contratoId: string): Promise<StatusFila> {
  const r = await chamar(
    'portal-cliente_fila-status',
    { contrato: contratoId, apikey: BUBBLE_API_KEY },
    'consultar a fila'
  )
  const candidatas = mapearCandidatas(r.ordens ?? [], r.planos ?? [])
  return {
    entrada: mapearEntrada(r.entrada),
    posicao: num(r.posicao),
    total: num(r.total),
    base: mapearBase(r.unidade),
    osElegivel: osDeOleoElegivel(candidatas),
  }
}

