import { Droplet, BellRing, Wrench } from 'lucide-react'

interface Props {
  // 'oferta': tem OS de óleo aberta e ainda não está na fila
  // 'na-fila': já está na fila, aguardando
  // 'chamado': foi chamado ou já está em atendimento
  fase: 'oferta' | 'na-fila' | 'chamado'
  posicao: number
  emAtendimento: boolean
  onVer: () => void
}

export function AlertaFilaOleo({ fase, posicao, emAtendimento, onVer }: Props) {
  // A entrada na fila saiu do portal: quem pede a vez agora é o aplicativo,
  // que tem a localização para provar que o cliente está mesmo na base.
  const textoOferta = 'Sua troca de óleo está liberada. Entre na fila pelo aplicativo Modo Corre.'

  if (fase === 'chamado') {
    return (
      <div className="flex w-full items-center gap-3 bg-accent px-4 py-3">
        {emAtendimento ? (
          <Wrench size={20} className="shrink-0 text-white" />
        ) : (
          <BellRing size={20} className="shrink-0 text-white" />
        )}
        <span className="flex-1 text-[13px] font-bold leading-5 text-white">
          {emAtendimento
            ? 'Sua moto está em atendimento na base.'
            : 'Você foi chamado! Leve a moto até o atendente.'}
        </span>
        <button
          onClick={onVer}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-accent-dark"
        >
          Ver
        </button>
      </div>
    )
  }

  if (fase === 'na-fila') {
    return (
      <div className="flex w-full items-center gap-3 bg-sky-600 px-4 py-3">
        <Droplet size={20} className="shrink-0 text-white" />
        <span className="flex-1 text-[13px] font-bold leading-5 text-white">
          Você está na fila de troca de óleo
          {posicao > 0 ? ' — ' + posicao + 'º lugar' : ''}.
        </span>
        <button
          onClick={onVer}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-sky-700"
        >
          Ver posição
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center gap-3 bg-amber-500 px-4 py-3">
      <Droplet size={20} className="shrink-0 text-white" />
      <span className="flex-1 text-[13px] font-bold leading-5 text-white">{textoOferta}</span>
      <button
        onClick={onVer}
        className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700"
      >
        Ver
      </button>
    </div>
  )
}
