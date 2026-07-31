import { useState } from 'react'
import { CheckCircle, Banknote, ExternalLink, Receipt } from 'lucide-react'
import type { Cliente } from '@/types/cliente'
import { resolverStatusParcela } from '@/utils/parcela'
import { useCountUp } from '@/hooks/useCountUp'
import { Paginacao } from '@/components/portal/Paginacao'
import { abrirLink } from '@/lib/abrir-link'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CONTRATO: { label: 'Contrato', color: '#3ba067', bg: 'rgba(59,160,103,0.14)' },
  MULTAS: { label: 'Multa', color: '#d97706', bg: '#fef3c7' },
  OS: { label: 'OS', color: '#6366f1', bg: '#eef2ff' },
  'KM EXCEDENTE': { label: 'KM Extra', color: '#0891b2', bg: '#e0f2fe' },
  'ACORDO DE PAGAMENTO': { label: 'Acordo', color: '#7c3aed', bg: '#ede9fe' },
}

interface Props {
  cliente: Cliente
}

export function ParcelasPagas({ cliente }: Props) {
  const contrato = cliente.contratos[0]
  const parcelasContratoAtual = contrato ? cliente.parcelas.filter((p) => p.contrato_id === contrato.id) : []
  const pagas = parcelasContratoAtual.filter((p) => resolverStatusParcela(p.status, p.vencimento) === 'paga')
  const totalPago = pagas.reduce((acc, p) => acc + p.valor, 0)

  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 10

  const countAnim = useCountUp(pagas.length, 700)
  const totalAnim = useCountUp(totalPago, 900)

  const itensPagina = [...pagas].reverse().slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div className="overflow-y-auto px-4">
      <h2 className="mb-4 mt-2 text-xl font-bold tracking-tight text-text-body">Parcelas pagas</h2>

      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-2xl border border-l-[3px] border-border border-l-accent bg-white p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <CheckCircle size={18} className="text-accent" />
            <span className="text-[11px] font-medium text-text-muted">Total pagas</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-text-body">{Math.round(countAnim)}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">parcelas</p>
        </div>
        <div className="flex-1 rounded-2xl border border-l-[3px] border-border border-l-accent bg-white p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Banknote size={18} className="text-accent" />
            <span className="text-[11px] font-medium text-text-muted">Valor total</span>
          </div>
          <p className="text-lg font-bold tracking-tight text-text-body">{formatarMoeda(totalAnim)}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">pago</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center bg-dark px-4 py-3">
          <span className="flex-[1.2] text-[9px] font-semibold uppercase tracking-wide text-text-faint">Vencimento</span>
          <span className="flex-[1.2] text-[9px] font-semibold uppercase tracking-wide text-text-faint">Valor</span>
          <span className="flex-1 text-[9px] font-semibold uppercase tracking-wide text-text-faint">Tipo</span>
          <span className="flex-[0.7] text-right text-[9px] font-semibold uppercase tracking-wide text-text-faint">Link</span>
        </div>

        {itensPagina.map((p, i) => {
          const tipoCfg = TIPO_CONFIG[p.tipo ?? ''] ?? { label: p.tipo ?? '—', color: '#71817a', bg: '#f4f6f5' }
          const isLast = i === itensPagina.length - 1
          return (
            <div
              key={p.numero}
              className={`flex items-center px-4 py-3.5 ${isLast ? '' : 'border-b border-surface'}`}
            >
              <span className="flex-[1.2] text-[13px] text-text-body">{formatarData(p.vencimento)}</span>
              <span className="flex-[1.2] text-[13px] font-semibold text-text-body">{formatarMoeda(p.valor)}</span>
              <span className="flex-1">
                {p.tipo ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: tipoCfg.bg, color: tipoCfg.color }}
                  >
                    {tipoCfg.label}
                  </span>
                ) : (
                  <span className="text-[13px] text-border">—</span>
                )}
              </span>
              <span className="flex flex-[0.7] justify-end">
                {p.link_pagamento ? (
                  <button
                    onClick={() => abrirLink(p.link_pagamento!)}
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-accent-light"
                  >
                    <ExternalLink size={13} className="text-accent" />
                  </button>
                ) : (
                  <span className="text-[13px] text-border">—</span>
                )}
              </span>
            </div>
          )
        })}

        {pagas.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 py-8">
            <Receipt size={32} className="text-border" />
            <p className="text-sm text-text-muted">Nenhuma parcela paga ainda.</p>
          </div>
        )}

        <Paginacao total={pagas.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
      </div>

      <div className="h-8" />
    </div>
  )
}
