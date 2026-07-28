import { useState } from 'react'
import pixLogo from '@/assets/pix-logo.png'

interface DadosPagamento {
  image: string
  payload: string
  descricao: string
  expiracao: string
  valor: number
}

interface Props {
  dados: DadosPagamento
  onClose: () => void
}

function formatarMoeda(valor: number) {
  const [int, dec] = valor.toFixed(2).split('.')
  return 'R$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec
}

function formatarExpiracao(exp: string) {
  const [data] = exp.split(' ')
  return data.split('-').reverse().join('/')
}

export function PagamentoModal({ dados, onClose }: Props) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(dados.payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-[380px] max-h-[90%] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <img src={pixLogo} alt="Pix" className="h-10 w-[100px] object-contain" />
          <button onClick={onClose} className="rounded-lg bg-zinc-100 p-1.5 text-sm text-zinc-500">
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center gap-3.5 px-5 py-5">
          <img
            src={`data:image/png;base64,${dados.image}`}
            alt="QR Code Pix"
            className="h-[200px] w-[200px] rounded-lg object-contain"
          />

          <div className="w-full rounded-xl bg-zinc-50 p-3.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Descrição</p>
            <p className="text-sm text-zinc-700">{dados.descricao}</p>
          </div>

          <div className="flex w-full gap-3">
            <div className="flex-1 rounded-xl bg-zinc-50 p-3.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Valor</p>
              <p className="text-sm font-bold text-zinc-700">{formatarMoeda(dados.valor)}</p>
            </div>
            <div className="flex-1 rounded-xl bg-zinc-50 p-3.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Expira em</p>
              <p className="text-sm text-zinc-700">{formatarExpiracao(dados.expiracao)}</p>
            </div>
          </div>

          <button
            onClick={copiar}
            className={`w-full rounded-xl py-[15px] text-sm font-bold text-white ${
              copiado ? 'bg-success' : 'bg-accent'
            }`}
          >
            {copiado ? '✓ Copiado!' : '⎘ Copiar código Pix'}
          </button>
        </div>
      </div>
    </div>
  )
}
