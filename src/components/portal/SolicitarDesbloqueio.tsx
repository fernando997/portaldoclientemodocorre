import { Unlock, Clock3, RefreshCw } from 'lucide-react'

interface Props {
  fase: 'solicitar' | 'aguardando' | 'atualizar'
  loading: boolean
  onSolicitar: () => void
  onAtualizar: () => void
}

export function SolicitarDesbloqueio({ fase, loading, onSolicitar, onAtualizar }: Props) {
  if (fase === 'aguardando') {
    return (
      <div className="flex w-full items-center gap-3 bg-amber-500 px-4 py-3">
        <Clock3 size={20} className="shrink-0 text-white" />
        <span className="flex-1 text-[13px] font-bold leading-5 text-white">
          Aguarde 30 minutos para processarmos sua solicitação.
        </span>
      </div>
    )
  }

  if (fase === 'atualizar') {
    return (
      <div className="flex w-full items-center gap-3 bg-sky-600 px-4 py-3">
        <RefreshCw size={20} className="shrink-0 text-white" />
        <span className="flex-1 text-[13px] font-bold leading-5 text-white">
          Sua solicitação de desbloqueio já pode ter sido processada.
        </span>
        <button
          onClick={onAtualizar}
          disabled={loading}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-sky-700 disabled:opacity-60"
        >
          {loading ? '...' : 'Atualizar status da solicitação'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center gap-3 bg-amber-500 px-4 py-3">
      <Unlock size={20} className="shrink-0 text-white" />
      <span className="flex-1 text-[13px] font-bold leading-5 text-white">
        Identificamos que seus pagamentos estão em dia. Solicite o desbloqueio do seu veículo.
      </span>
      <button
        onClick={onSolicitar}
        disabled={loading}
        className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 disabled:opacity-60"
      >
        {loading ? '...' : 'Solicitar desbloqueio'}
      </button>
    </div>
  )
}
