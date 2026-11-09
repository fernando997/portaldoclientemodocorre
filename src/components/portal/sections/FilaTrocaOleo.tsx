import { ArrowLeft, Droplet, Smartphone, BellRing, Wrench } from 'lucide-react'
import { POSICAO_ALERTA, type FilaOleo } from '@/hooks/useFilaOleo'

interface Props {
  fila: FilaOleo
  onVoltar: () => void
}

function formatarHora(ts: number) {
  if (!ts) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function FilaTrocaOleo({ fila, onVoltar }: Props) {
  const { status, carregando, erro } = fila
  const entrada = status?.entrada ?? null
  const posicao = status?.posicao ?? 0
  const total = status?.total ?? 0
  const emAtendimento = entrada?.status === 'EM_ATENDIMENTO'
  const chamado = !!entrada?.chamadoEmTs
  const quaseNaVez = !emAtendimento && posicao > 0 && posicao <= POSICAO_ALERTA
  const naFrente = Math.max(0, posicao - 1)

  const destaque = emAtendimento || chamado
  const classeCartao = destaque
    ? 'border-accent bg-accent-light'
    : quaseNaVez
      ? 'border-amber-300 bg-amber-50'
      : 'border-zinc-200 bg-white'

  return (
    <div className="overflow-y-auto px-4">
      <button
        onClick={onVoltar}
        className="mb-3 mt-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-500"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Fila de troca de óleo</h2>

      {carregando && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
          <p className="text-sm text-zinc-400">Carregando...</p>
        </div>
      )}

      {!carregando && erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-[13px] text-danger">{erro}</p>
        </div>
      )}

      {!carregando && !erro && entrada && (
        <div className="flex flex-col gap-4">
          <div className={'flex flex-col items-center gap-1 rounded-2xl border p-6 ' + classeCartao}>
            {emAtendimento ? (
              <>
                <Wrench size={26} className="mb-1 text-accent" />
                <p className="text-lg font-bold text-text-body">Sua moto está em atendimento</p>
                <p className="text-center text-[13px] text-text-muted">
                  Procure o atendente da base se precisar de algo.
                </p>
              </>
            ) : chamado ? (
              <>
                <BellRing size={26} className="mb-1 text-accent" />
                <p className="text-lg font-bold text-text-body">Você foi chamado!</p>
                <p className="text-center text-[13px] text-text-muted">
                  Leve a moto até o atendente da base agora.
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Sua posição na fila
                </p>
                <p className="text-6xl font-bold tabular-nums text-text-body">{posicao || '--'}</p>
                <p className="text-[13px] text-text-muted">
                  {naFrente === 0
                    ? 'Você é o próximo a ser atendido'
                    : naFrente + (naFrente === 1 ? ' moto na sua frente' : ' motos na sua frente')}
                </p>
              </>
            )}
          </div>

          {quaseNaVez && !chamado && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <BellRing size={20} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">Prepare-se, está chegando</p>
                <p className="text-[13px] leading-5 text-amber-800">
                  Você está entre os próximos a serem atendidos. Fique perto da moto e aguarde ser
                  chamado.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="text-[13px] text-text-muted">Entrou na fila</span>
              <span className="text-[13px] font-semibold text-text-body">
                {formatarHora(entrada.entrouEmTs)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="text-[13px] text-text-muted">Moto</span>
              <span className="text-[13px] font-semibold text-text-body">{entrada.placa || '--'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="text-[13px] text-text-muted">Ordem de serviço</span>
              <span className="text-[13px] font-semibold text-text-body">
                {entrada.numeroOs != null ? 'OS ' + entrada.numeroOs : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-text-muted">Aguardando na base</span>
              <span className="text-[13px] font-semibold text-text-body">
                {total} {total === 1 ? 'moto' : 'motos'}
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-text-muted">
            Esta tela se atualiza sozinha. Você pode deixá-la aberta enquanto espera.
          </p>
        </div>
      )}

      {!carregando && !erro && !entrada && status?.osElegivel && (
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2.5">
            <Droplet size={20} className="shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-body">Troca de óleo liberada</p>
              <p className="text-xs text-text-muted">
                {status.osElegivel.numero != null
                  ? 'OS ' + status.osElegivel.numero + ' aberta para a sua moto'
                  : 'OS aberta para a sua moto'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-surface p-3">
            <Smartphone size={16} className="mt-0.5 shrink-0 text-text-muted" />
            <p className="text-[13px] leading-5 text-text-muted">
              Para pegar a sua vez, use o aplicativo Modo Corre
              {status.base?.nome ? ' na base ' + status.base.nome : ' na base do seu contrato'}. Na
              base, o totem do atendimento também continua disponível.
            </p>
          </div>
        </div>
      )}

      {!carregando && !erro && !entrada && !status?.osElegivel && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-10">
          <Droplet size={30} className="text-border" />
          <p className="text-center text-[13px] text-zinc-400">
            Você não tem uma ordem de serviço de troca de óleo aberta no momento.
          </p>
          <p className="text-center text-xs text-zinc-400">
            Quando a base gerar a OS da sua próxima troca, a fila aparece aqui.
          </p>
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
