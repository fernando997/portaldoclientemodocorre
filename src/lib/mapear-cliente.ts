import type { Cliente } from '@/types/cliente'
import type { BubbleResposta, BubbleParcela, BubbleVeiculo, BubbleFiador } from '@/data/bubble-estrutura'
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

function mapearVeiculo(v: BubbleVeiculo) {
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

function mapearFiador(f: BubbleFiador) {
  return {
    nome: f.nome,
    cpf: f.cpf,
    telefone: f.whatsapp,
  }
}

export function mapearCliente(bubble: BubbleResposta['response']): Cliente {
  logCaminhos(bubble, 'response')
  const c = bubble.cliente
  const ct = Object.keys(bubble.contrato).length > 0 ? bubble.contrato : null
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
    contratos: ct ? [{
      id: (ct as any)._id,
      numero: (ct as any)['Numero ctr'],
      veiculo_id: bubble.veiculo?._id ?? '',
      veiculo: veiculo ?? {
        placa: '',
        modelo: '',
        marca: '',
        ano: 0,
        cor: '',
        chassi: '',
        km: 0,
      },
      descricao: nomePlano,
      prazo_dias: prazoDias,
      prazo_meses: prazoMeses,
      data_inicio: (ct as any)['Created Date'] ? timestampParaData((ct as any)['Created Date']) : '',
      data_fim: (() => {
        const inicio = (ct as any)['Created Date']
        const meses = prazoMeses
        if (!inicio || !meses) return (ct as any).fim ? timestampParaData((ct as any).fim) : ''
        const d = new Date(inicio)
        d.setMonth(d.getMonth() + meses)
        return d.toISOString().split('T')[0]
      })(),
      valor_total: (ct as any).parcela_final ?? 0,
      total_parcelas: totalParcelas,
      parcelas_pagas: parcelasPagas,
      parcelas_restantes: parcelasRestantes,
      status: (ct as any).status ?? '',
      validade_cnh: c.cnh_validade ?? '',
      fiador: fiador?.nome ?? '',
      cpf_fiador: fiador?.cpf ?? '',
      telefone_fiador: fiador?.telefone ?? '',
      link_contrato: (ct as any).url_contrato ? `https:${(ct as any).url_contrato}` : null,
      link_documento_moto: null,
    }] : [],
    parcelas,
    lancamentos: [],
    vistorias: [],
    tabela_tarifaria: [],
  }
}
