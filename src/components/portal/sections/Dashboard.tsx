import { Ribbon, Car, Hourglass, Clock, ArrowRight } from 'lucide-react'
import type { Cliente } from '@/types/cliente'

interface Props {
  cliente: Cliente
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function calcularTempoRestante(dataFim: string): string {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(dataFim + 'T00:00:00')
  const diffMs = fim.getTime() - hoje.getTime()
  if (diffMs <= 0) return 'Contrato encerrado'
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (dias >= 30) {
    const meses = Math.floor(dias / 30)
    const diasRest = dias % 30
    return diasRest > 0
      ? `${meses} mês${meses > 1 ? 'es' : ''} e ${diasRest} dia${diasRest > 1 ? 's' : ''}`
      : `${meses} mês${meses > 1 ? 'es' : ''}`
  }
  return `${dias} dia${dias > 1 ? 's' : ''}`
}

function calcularProgresso(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio + 'T00:00:00').getTime()
  const fim = new Date(dataFim + 'T00:00:00').getTime()
  const hoje = new Date().getTime()
  if (hoje >= fim) return 1
  if (hoje <= inicio) return 0
  return (hoje - inicio) / (fim - inicio)
}

export function Dashboard({ cliente }: Props) {
  const contrato = cliente.contratos.find((c) => c.status === 'ativo') ?? cliente.contratos[0]

  if (!contrato) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-center text-sm text-text-muted">Nenhum contrato ativo encontrado.</p>
      </div>
    )
  }

  const progresso = calcularProgresso(contrato.data_inicio, contrato.data_fim)
  const porcentagem = Math.min(Math.round(progresso * 100), 100)
  const tempoRestante = calcularTempoRestante(contrato.data_fim)

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-4 pb-8">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Ribbon size={18} className="text-accent" />
          <span className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">Tipo de Plano</span>
        </div>
        <p className="text-lg font-bold tracking-tight text-text-body">{contrato.descricao || '—'}</p>
        <div className="flex items-center gap-1.5">
          <Car size={13} className="text-text-muted" />
          <span className="text-xs text-text-muted">
            {contrato.veiculo.marca} {contrato.veiculo.modelo} · {contrato.veiculo.placa}
          </span>
        </div>
      </div>

      {(contrato.prazo_dias != null || contrato.prazo_meses != null) && (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Hourglass size={18} className="text-accent" />
            <span className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">Prazo</span>
          </div>
          <div className="flex items-center gap-4">
            {contrato.prazo_meses != null && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-3xl font-bold tracking-tight text-text-body">{contrato.prazo_meses}</span>
                <span className="text-xs uppercase tracking-wide text-text-muted">meses</span>
              </div>
            )}
            {contrato.prazo_dias != null && contrato.prazo_meses != null && (
              <div className="h-9 w-px bg-border" />
            )}
            {contrato.prazo_dias != null && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-3xl font-bold tracking-tight text-text-body">{contrato.prazo_dias}</span>
                <span className="text-xs uppercase tracking-wide text-text-muted">dias</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-accent" />
          <span className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">Tempo do Contrato</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="mb-0.5 text-xs text-text-muted">Início</p>
            <p className="text-sm font-bold text-text-body">{formatarData(contrato.data_inicio)}</p>
          </div>
          <ArrowRight size={16} className="text-text-muted" />
          <div className="text-right">
            <p className="mb-0.5 text-xs text-text-muted">Término</p>
            <p className="text-sm font-bold text-text-body">{formatarData(contrato.data_fim)}</p>
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
          <div className="h-1.5 rounded-full bg-accent" style={{ width: `${porcentagem}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{porcentagem}% do período</span>
          <span className="flex items-center gap-1 rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent">
            <Hourglass size={11} />
            {tempoRestante} restante{progresso >= 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  )
}
