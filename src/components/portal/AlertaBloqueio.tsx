import { OctagonAlert, ChevronRight } from 'lucide-react'

interface Props {
  onClick: () => void
}

export function AlertaBloqueio({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 bg-danger px-4 py-3 text-left"
    >
      <OctagonAlert size={20} className="shrink-0 text-white" />
      <span className="flex-1 text-[13px] font-bold leading-5 text-white">
        Atenção para evitar o bloqueio total do seu veículo efetue os pagamentos em aberto
      </span>
      <ChevronRight size={18} className="shrink-0 text-white" />
    </button>
  )
}
