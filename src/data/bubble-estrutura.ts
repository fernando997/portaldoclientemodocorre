// Estrutura retornada pelo Bubble — endpoint: chamar-contrato

export interface BubbleCliente {
  _id: string
  nome_completo: string
  cpf: string
  data_nascimento: string
  email: string
  celular: string
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  cep: number
  foto_face: string
  foto_cnh: string
  foto_comprovante_de_residencia: string
  sexo: string
  status: string
  cnh_numero: number
  cnh_validade: string
  cnh_categoria: string
  'cnh_emissão': string
  cnh_uf_emissão: string
  cnh_local_emissão: string
  nome_pai: string
  nome_mae: string
  bricks_id: string
  customer_id_asaas?: string
  fiador?: string
  unidade?: string
  contrato?: string
  operador: string
  'Created Date': number
  'Modified Date': number
  'Created By': string
}

export interface BubbleContrato {
  _id: string
  'Numero ctr': number
  'numero seq ctr': number
  status: string
  'status assinatura': string
  'tipo de contrato': string
  tipo_de_entrega: string
  inicio: number
  fim: number
  nova_renovação: number
  prazo_maximo_renovações: number
  cliente: string
  placa: string
  bloqueio?: string
  planos: string | { 'descrição': string; [key: string]: any }
  prazo: string | { dias: number; meses: number; [key: string]: any }
  'franquia de km': string
  'caução': string
  parcela_caucao: number
  parcela_final: number
  'proteções': string[]
  fiadores: string
  grupo: string
  unidade: string
  'forma de pagamento': string
  'origem do contrato': string
  'tipo de contrato plan': string
  'agente operador': string
  contrato_assinado: string
  url_contrato?: string
  token_zapsign: string
  zapSign_openId: number
  km_inicial: number
  diarias: number
  combustivel: string
  comissao1pgt: number
  'observação': string
  'Created Date': number
  'Modified Date': number
  'Created By': string
}

export interface BubbleParcela {
  _id: string
  'numero parcela': string
  'descrição parcela': string
  tipo: string
  status: string
  'valor parcela': number
  vencimento: number
  pagamento?: number
  'comprovante link'?: string
  url_pagamento: string
  placa: string
  contrato_atrelado: string
  'bloqueio autorizado'?: string
  unidade: string
  cus_id: string
  'id asaas': string
  Locadora_tck: string
  'lançamento'?: string
  'Created Date': number
  'Modified Date': number
  'Created By': string
}

export interface BubbleVeiculo {
  _id: string
  placa: string
  modelo: string
  cor: string
  chassi: string
  km: number
  'ano-modelo': string
  combustivel: string
  renavam: string
  status: string
  status_veiculo_desc: string
  unidade: string
  cidade: string
  estado: string
  locadora: string
  documento?: string
  'Created Date': number
  'Modified Date': number
  'Created By': string
}

// Retornada dentro de response.multas no endpoint portal-cliente_vistorias
export interface BubbleMulta {
  _id: string
  ait: string
  cidade: string
  cod_barra: string
  cod_ctb: string
  comprovante_pg?: string
  contrato_atrelado: string
  data: number
  data_cadastro: number
  data_ind_condutor?: number
  descricao: string
  'doc_infração'?: string
  doc_nic?: string
  endereco: string
  file_pagamento?: string
  hora: string
  id_externo_veiculo: number
  id_interno_veiculo: string
  id_multa: number
  id_numero: number
  id_proprietario: string
  id_unico: number
  id_unidade: string
  nic: string
  nome_proprietario: string
  orgao: string
  pix_copia_cola?: string
  placa: string
  pontos_cnh: string
  renainf: string
  responsavel: string
  senatran_pg?: string
  status: string
  Taxa_adm_avista: number
  Taxa_adm_parcelado: number
  tipo: string
  valor_bruto: string
  valor_desconto: string
  vel_aferida: string
  velo_medida: string
  vencimento: number
  'Created Date': number
  'Modified Date': number
  'Created By': string
}

export interface BubbleFiador {
  _id: string
  nome: string
  cpf: string
  rg: string
  whatsapp: string
  email: string
  sexo: string
  'data de nascimento': string
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  cep: number
  status: string
  locatario: string
  idbricks: string
  'Created Date': number
  'Modified Date': number
  'Created By': string
}

export interface BubblePlano {
  _id?: string
  'descrição'?: string
  [key: string]: any
}

export interface BubblePrazo {
  _id?: string
  dias?: number
  meses?: number
  [key: string]: any
}

export interface BubbleResposta {
  status: 'success' | 'error'
  response: {
    cliente: BubbleCliente
    contrato: BubbleContrato | Record<string, never>
    contratos?: BubbleContrato[]
    parcelas?: BubbleParcela[]
    veiculo?: BubbleVeiculo
    fiador?: BubbleFiador
    planos?: BubblePlano
    prazo?: BubblePrazo
    nome_plano?: string
    prazo_dias?: number
    prazo_meses?: number
  }
}
