export interface Veiculo {
  placa: string
  modelo: string
  marca: string
  ano: number
  cor: string
  chassi: string
  km: number
}

export interface Endereco {
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export interface Contrato {
  id: string
  numero: number
  veiculo: Veiculo
  veiculo_id: string
  descricao: string
  prazo_dias: number | null
  prazo_meses: number | null
  data_inicio: string
  data_fim: string
  valor_total: number
  total_parcelas: number
  parcelas_pagas: number
  parcelas_restantes: number
  status: string
  validade_cnh: string
  fiador: string
  cpf_fiador: string
  telefone_fiador: string
  link_contrato: string | null
  link_documento_moto: string | null
  bloqueio: string
  solicitacao_desbloqueio_status: string | null
  solicitacao_desbloqueio_criada_em: string | null
}

export type StatusParcela = 'paga' | 'atrasada' | 'a_vencer'
export type TipoParcela = 'CONTRATO' | 'MULTAS' | 'OS' | 'KM EXCEDENTE' | 'ACORDO DE PAGAMENTO'

export interface OSItem {
  descricao: string
  valor: number
}

export interface OSSimples {
  tipo: 'OS Simples' | 'OS de Venda' | 'OS de Liberação' | 'OS de Guincho'
  numero: string
  data_hora: string
  placa: string
  km: number
  itens: OSItem[]
  valor?: number
}

export interface ItemLancamento {
  vencimento: string
  status: string
  tipo: TipoParcela
  link: string | null
  valor: number
}

export interface LancamentoFinanceiro {
  id: string
  tipo: TipoParcela
  placa: string
  descricao: string
  parcelas: ItemLancamento[]
}

export interface Parcela {
  numero: number
  vencimento: string
  valor: number
  status: string
  data_pagamento: string | null
  tipo?: TipoParcela
  link_pagamento?: string | null
  os_simples?: OSSimples
  lancamento_id?: string
  id_pay?: string
  bloqueio_autorizado: string
  contrato_id: string
  descricao: string
}

export interface Vistoria {
  id: string
  contrato: string
  data: string
  placa: string
  tipo: string
  responsavel: string
  status: 'concluida' | 'agendada'
  observacoes: string | null
  link_pdf: string | null
  midias?: string[]
}

export interface ItemTarifario {
  servico: string
  valor: number
  periodicidade: string
}

export interface Multa {
  id: string
  ait: string
  data_cadastro: string
  valor: number
  link_ait: string | null
  orgao: string
  descricao: string
  endereco: string
  data: string
  hora: string
  status: string
  placa: string
  pontos_cnh: string
  vencimento: string
  link_comprovante: string | null
  cod_barra: string
  pix_copia_cola: string
}

export interface OrdemServico {
  id: string
  numero: number
  data_hora: string
  tipo: string
  fornecedor: string
  status: string
  km: number
}

export interface PlanoManutencao {
  id: string
  data: string
  descricao: string
  km: number
  status: string
  plano_nome: string
}

export interface Cliente {
  id: string
  foto_url: string | null
  nome_completo: string
  cpf: string
  rg: string
  data_nascimento: string
  email: string
  celular: string
  telefone_fixo: string
  estado_civil: string
  profissao: string
  renda_mensal: number
  endereco: Endereco
  contratos: Contrato[]
  parcelas: Parcela[]
  lancamentos: LancamentoFinanceiro[]
  vistorias: Vistoria[]
  tabela_tarifaria: ItemTarifario[]
  multas: Multa[]
  ordens_servico: OrdemServico[]
  planos_manutencao: PlanoManutencao[]
}
