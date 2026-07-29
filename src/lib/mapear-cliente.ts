import type { Cliente, Contrato } from '@/types/cliente'
import type { BubbleResposta, BubbleParcela, BubbleVeiculo, BubbleFiador, BubbleContrato } from '@/data/bubble-estrutura'
import { logCaminhos } from '@/lib/debug-log'

export function timestampParaData(ts: number): string {
  return new Date(ts).toISOString().split('T')[0]
}

export function mapearParcela(p: BubbleParcela, index: number): Cliente['parcelas'][0] {
  return {
    numero: index + 1,
    valor: p['valor parcela'],
    vencimento: timestampParaData(p.vencimento),
    status: p.status,
    data_pagamento: p.pagamento ? timestampParaData(p.pagamento) : null,
    tipo: p.tipo as Cliente['parcelas'][0]['tipo'],
    link_pagamento: p.status === 'PAGO' ? (p['comprovante link'] ?? p.url_pagamento) : p.url_pagamento,
    lancamento_id: p['lançamento'],
    id_pay: p['id asaas'],
  }
}

export function mapearVeiculo(v: BubbleVeiculo) {
  const partes = v.modelo.split('/')
  const marca = partes[0]?.trim() ?? ''
  const modelo = partes[1]?.trim() ?? v.modelo
  const ano = parseInt(v['ano-modelo']?.split('/')[0] ?? '0')

  return {
    placa: v.placa,
    modelo,
    marca,
    ano,
    cor: v.cor,
    chassi: v.chassi,
    km: v.km,
  }
}

export function mapearFiador(f: BubbleFiador) {
  return {
    nome: f.nome,
    cpf: f.cpf,
    telefone: f.whatsapp,
  }
}

function ordenarESelecionar(contratos: Contrato[]): Contrato[] {
  const porRecencia = [...contratos].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))
  const selecionado =
    porRecencia.find((c) => c.status === 'ativo') ??
    porRecencia.find((c) => c.status !== 'reprovado') ??
    porRecencia[0] ??
    null
  if (!selecionado) return porRecencia
  return [selecionado, ...porRecencia.filter((c) => c.id !== selecionado.id)]
}

interface ContextoContratoPrimario {
  ctPrimarioId: string | undefined
  veiculoPrimario: ReturnType<typeof mapearVeiculo> | null
  documentoPrimario: string | undefined
  fiadorPrimario: ReturnType<typeof mapearFiador> | null
  nomePlanoPrimario: string
  prazoDiasPrimario: number | null
  prazoMesesPrimario: number | null
  totalParcelas: number
  parcelasPagas: number
  parcelasRestantes: number
  validadeCnh: string
}

function mapearContratoDaLista(ct: BubbleContrato, ctx: ContextoContratoPrimario): Contrato {
  const ehPrimario = ct._id === ctx.ctPrimarioId

  const planoObj = typeof ct.planos === 'object' ? ct.planos : null
  const prazoObj = typeof ct.prazo === 'object' ? ct.prazo : null

  const descricao = planoObj?.['descrição'] ?? planoObj?.['descricao'] ?? (ehPrimario ? ctx.nomePlanoPrimario : '')
  const prazoDias = prazoObj?.dias ?? (ehPrimario ? ctx.prazoDiasPrimario : null)
  const prazoMeses = prazoObj?.meses ?? (ehPrimario ? ctx.prazoMesesPrimario : null)

  const veiculo =
    ehPrimario && ctx.veiculoPrimario
      ? ctx.veiculoPrimario
      : { placa: ct.placa ?? '', modelo: '', marca: '', ano: 0, cor: '', chassi: '', km: 0 }

  const inicio = ct['Created Date']

  return {
    id: ct._id,
    numero: ct['Numero ctr'],
    veiculo_id: '',
    veiculo,
    descricao,
    prazo_dias: prazoDias,
    prazo_meses: prazoMeses,
    data_inicio: inicio ? timestampParaData(inicio) : '',
    data_fim: (() => {
      if (!inicio || !prazoMeses) return ct.fim ? timestampParaData(ct.fim) : ''
      const d = new Date(inicio)
      d.setMonth(d.getMonth() + prazoMeses)
      return d.toISOString().split('T')[0]
    })(),
    valor_total: ct.parcela_final ?? 0,
    total_parcelas: ctx.totalParcelas,
    parcelas_pagas: ctx.parcelasPagas,
    parcelas_restantes: ctx.parcelasRestantes,
    status: ct.status ?? '',
    validade_cnh: ctx.validadeCnh,
    fiador: ehPrimario ? (ctx.fiadorPrimario?.nome ?? '') : '',
    cpf_fiador: ehPrimario ? (ctx.fiadorPrimario?.cpf ?? '') : '',
    telefone_fiador: ehPrimario ? (ctx.fiadorPrimario?.telefone ?? '') : '',
    link_contrato: ct.url_contrato ? `https:${ct.url_contrato}` : null,
    link_documento_moto: ehPrimario && ctx.documentoPrimario ? `https:${ctx.documentoPrimario}` : null,
  }
}

export function mapearCliente(bubble: BubbleResposta['response']): Cliente {
  logCaminhos(bubble, 'response')
  const c = bubble.cliente
  const ct = Object.keys(bubble.contrato).length > 0 ? (bubble.contrato as BubbleContrato) : null
  const veiculo = bubble.veiculo ? mapearVeiculo(bubble.veiculo) : null
  const fiador = bubble.fiador ? mapearFiador(bubble.fiador) : null
  const parcelas = (bubble.parcelas ?? []).map((p, i) => mapearParcela(p, i))

  // Conta apenas parcelas de tipo CONTRATO para o resumo do plano
  const parcelasContrato = parcelas.filter(p => !p.tipo || p.tipo === 'CONTRATO')
  const totalParcelas = parcelasContrato.length
  const parcelasPagas = parcelasContrato.filter(p => p.status === 'PAGO').length
  const parcelasRestantes = totalParcelas - parcelasPagas

  // Fonte primária: key separada planos/prazo como objeto expandido (igual a cliente/veiculo)
  // Fonte alternativa: nome_plano como texto simples
  const planoObj = bubble.planos ?? null
  const prazoObj = bubble.prazo  ?? null

  const nomePlano =
    planoObj?.['descrição'] ??
    planoObj?.['descricao'] ??
    bubble.nome_plano ??
    ''

  const prazoDias  = prazoObj?.dias  ?? bubble.prazo_dias  ?? null
  const prazoMeses = prazoObj?.meses ?? bubble.prazo_meses ?? null

  const listaBruta: BubbleContrato[] = bubble.contratos?.length ? bubble.contratos : ct ? [ct] : []

  const contratos = ordenarESelecionar(
    listaBruta.map((item) =>
      mapearContratoDaLista(item, {
        ctPrimarioId: ct?._id,
        veiculoPrimario: veiculo,
        documentoPrimario: bubble.veiculo?.documento,
        fiadorPrimario: fiador,
        nomePlanoPrimario: nomePlano,
        prazoDiasPrimario: prazoDias,
        prazoMesesPrimario: prazoMeses,
        totalParcelas,
        parcelasPagas,
        parcelasRestantes,
        validadeCnh: c.cnh_validade ?? '',
      })
    )
  )

  return {
    id: c._id,
    foto_url: c.foto_face ? `https:${c.foto_face}` : null,
    nome_completo: c.nome_completo,
    cpf: c.cpf,
    rg: '',
    data_nascimento: c.data_nascimento,
    email: c.email,
    celular: c.celular,
    telefone_fixo: '',
    estado_civil: '',
    profissao: '',
    renda_mensal: 0,
    endereco: {
      logradouro: c.logradouro ?? '',
      numero: c.numero ?? '',
      bairro: c.bairro ?? '',
      cidade: c.cidade ?? '',
      estado: c.estado ?? '',
      cep: c.cep ? String(c.cep) : '',
    },
    contratos,
    parcelas,
    lancamentos: [],
    vistorias: [],
    tabela_tarifaria: [],
    multas: [],
    ordens_servico: [],
    planos_manutencao: [],
  }
}
