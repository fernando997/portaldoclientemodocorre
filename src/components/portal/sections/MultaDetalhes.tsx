import { useState } from 'react'
import { ArrowLeft, Download, Barcode, Copy, Check, type LucideIcon } from 'lucide-react'
import type { Multa } from '@/types/cliente'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  if (!iso) return '—'
  return iso.split('-').reverse().join('/')
}

interface Props {
  multa: Multa
  onVoltar: () => void
}

function BotaoCopiar({
  label,
  valor,
  Icon = Copy,
  destaque = false,
}: {
  label: string
  valor: string
  Icon?: LucideIcon
  destaque?: boolean
}) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(valor)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      onClick={copiar}
      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold ${
        copiado ? 'bg-success text-white' : destaque ? 'bg-accent text-white' : 'bg-zinc-100 text-zinc-600'
      }`}
    >
      {copiado ? <Check size={16} /> : <Icon size={16} />}
      {copiado ? 'Copiado!' : label}
    </button>
  )
}

export function MultaDetalhes({ multa, onVoltar }: Props) {
  return (
    <div className="overflow-y-auto px-4">
      <button onClick={onVoltar} className="mb-3 mt-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-500">
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 bg-[#0d1b2a] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-300">AIT</p>
          <p className="mt-0.5 text-lg font-bold text-white">{multa.ait || '—'}</p>
        </div>

        <div className="flex flex-wrap gap-4 px-5 py-5">
          <div className="w-[45%]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Data da multa</p>
            <p className="text-sm font-bold text-zinc-900">{formatarData(multa.data)}</p>
          </div>
          <div className="w-[45%]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Hora</p>
            <p className="text-sm font-bold text-zinc-900">{multa.hora || '—'}</p>
          </div>
          <div className="w-[45%]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Valor</p>
            <p className="text-sm font-bold text-accent">{formatarMoeda(multa.valor)}</p>
          </div>
          <div className="w-[45%]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Status</p>
            <p className="text-sm font-bold text-zinc-900">{multa.status || '—'}</p>
          </div>
          <div className="w-full">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Descrição</p>
            <p className="text-sm text-zinc-700">{multa.descricao || '—'}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-zinc-100 px-5 py-5">
          {multa.link_ait ? (
            <a
              href={multa.link_ait}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white"
            >
              <Download size={16} />
              Documento AIT
            </a>
          ) : (
            <button
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-sm font-bold text-zinc-300"
            >
              <Download size={16} />
              Documento AIT indisponível
            </button>
          )}

          {multa.cod_barra && (
            <BotaoCopiar label="Copiar código de barras" valor={multa.cod_barra} Icon={Barcode} />
          )}

          {multa.pix_copia_cola && (
            <BotaoCopiar label="Copiar Pix" valor={multa.pix_copia_cola} destaque />
          )}
        </div>
      </div>

      <div className="h-8" />
    </div>
  )
}
