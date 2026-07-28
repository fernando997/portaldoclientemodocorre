import type { OSSimples } from '@/types/cliente'

function formatarMoeda(valor: number) {
  const [int, dec] = valor.toFixed(2).split('.')
  return 'R$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec
}

function formatarDataHora(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props {
  os: OSSimples
  onClose: () => void
}

export function OSModal({ os, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[80%] overflow-y-auto rounded-t-[20px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-[18px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{os.tipo}</p>
            <p className="mt-0.5 text-lg font-bold text-zinc-900">{os.numero}</p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-zinc-100 p-2 text-sm text-zinc-500">
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-4 px-5 pt-5 pb-8">
          <div className="w-[45%]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Data e hora</p>
            <p className="text-sm font-bold text-zinc-900">{formatarDataHora(os.data_hora)}</p>
          </div>
          <div className="w-[45%]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Placa</p>
            <p className="text-sm font-bold text-zinc-900">{os.placa}</p>
          </div>
          <div className="w-[45%]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">KM</p>
            <p className="text-sm font-bold text-zinc-900">
              {os.km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km
            </p>
          </div>
          {os.valor != null && (
            <div className="w-[45%]">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Valor</p>
              <p className="text-sm font-bold text-accent">{formatarMoeda(os.valor)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
