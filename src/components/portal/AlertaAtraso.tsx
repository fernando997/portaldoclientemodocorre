import type { Parcela } from '@/types/cliente'
import { resolverStatusParcela } from '@/utils/parcela'

function formatarData(iso: string) {
  return iso.split('-').reverse().join('/')
}

function formatarMoeda(valor: number) {
  const [int, dec] = valor.toFixed(2).split('.')
  return 'R$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec
}

interface Props {
  parcelas: Parcela[]
  onClose: () => void
  onVerPagamentos: () => void
}

export function AlertaAtraso({ parcelas, onClose, onVerPagamentos }: Props) {
  const atrasadas = parcelas.filter((p) => resolverStatusParcela(p.status, p.vencimento) === 'atrasada')

  if (atrasadas.length === 0) return null

  const total = atrasadas.reduce((acc, p) => acc + p.valor, 0)

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto rounded-t-[20px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-[18px]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-zinc-900">
                Parcela{atrasadas.length > 1 ? 's' : ''} em atraso
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Você possui {atrasadas.length} parcela{atrasadas.length > 1 ? 's' : ''} vencida
                {atrasadas.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg bg-zinc-100 p-2 text-sm text-zinc-500">
            ✕
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="mb-0.5 flex rounded-lg bg-[#0d1b2a] px-3 py-2.5">
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">Vencimento</span>
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">Tipo</span>
            <span className="flex-1 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-300">Valor</span>
          </div>
          {atrasadas.map((p) => (
            <div key={p.numero} className="flex items-center border-b border-zinc-100 px-3 py-2.5">
              <span className="flex-1 text-xs text-zinc-600">{formatarData(p.vencimento)}</span>
              <span className="flex-1">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                  {p.tipo ?? '—'}
                </span>
              </span>
              <span className="flex-1 text-right text-xs font-semibold text-danger">{formatarMoeda(p.valor)}</span>
            </div>
          ))}

          <div className="mb-4 mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
            <span className="text-sm font-semibold text-zinc-700">Total em atraso</span>
            <span className="text-base font-bold text-danger">{formatarMoeda(total)}</span>
          </div>

          <div className="mb-4 rounded-xl border border-[#FDE68A] bg-warning-bg p-3.5">
            <p className="text-[13px] leading-5 text-[#92400e]">
              <span className="font-bold">Atenção: </span>
              parcelas em atraso podem resultar no bloqueio da moto. Regularize o quanto antes para evitar transtornos.
            </p>
          </div>

          <button
            onClick={onVerPagamentos}
            className="mb-6 w-full rounded-xl bg-accent py-[15px] text-sm font-bold text-white"
          >
            Ir para Próximos Pagamentos →
          </button>
        </div>
      </div>
    </div>
  )
}
