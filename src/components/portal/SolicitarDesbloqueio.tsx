import { Unlock } from 'lucide-react'

interface Props {
  onClick: () => void
  loading: boolean
  pendente: boolean
}

export function SolicitarDesbloqueio({ onClick, loading, pendente }: Props) {
  return (
    <div className="flex w-full items-center gap-3 bg-amber-500 px-4 py-3">
      <Unlock size={20} className="shrink-0 text-white" />
      <span className="flex-1 text-[13px] font-bold leading-5 text-white">
        Identificamos que seus pagamentos estão em dia. Solicite o desbloqueio do seu veículo.
      </span>
      <button
        onClick={onClick}
        disabled={loading || pendente}
        className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 disabled:opacity-60"
      >
        {loading ? '...' : pendente ? 'Em análise' : 'Solicitar desbloqueio'}
      </button>
    </div>
  )
}
