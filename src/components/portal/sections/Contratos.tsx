import { useState } from 'react'
import type { Cliente } from '@/types/cliente'
import { Paginacao } from '@/components/portal/Paginacao'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ativo: { label: 'Ativo', color: '#15803d', bg: '#dcfce7' },
  encerrado: { label: 'Encerrado', color: '#71717a', bg: '#f4f4f5' },
  suspenso: { label: 'Suspenso', color: '#92400e', bg: '#fef3c7' },
  reprovado: { label: 'Reprovado', color: '#dc2626', bg: '#fee2e2' },
}

interface Props {
  cliente: Cliente
}

export function Contratos({ cliente }: Props) {
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 10
  const itensPagina = cliente.contratos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div className="overflow-y-auto px-4">
      <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Contratos</h2>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex bg-[#0d1b2a] px-3 py-2.5">
          <span className="flex-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Contrato</span>
          <span className="w-[90px] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Placa</span>
          <span className="w-[90px] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Status</span>
          <span className="w-[140px] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Ações</span>
        </div>

        {itensPagina.map((contrato) => {
          const cfg = statusConfig[contrato.status] ?? {
            label: contrato.status || 'Desconhecido',
            color: '#71717a',
            bg: '#f4f4f5',
          }
          return (
            <div key={contrato.id} className="flex items-center border-b border-zinc-100 px-3 py-3">
              <span className="flex-1 text-xs font-semibold text-zinc-600">{contrato.numero}</span>
              <span className="w-[90px] text-xs text-zinc-600">{contrato.veiculo.placa}</span>
              <span className="w-[90px]">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </span>
              <span className="flex w-[140px] gap-1.5">
                {contrato.link_contrato && (
                  <a
                    href={contrato.link_contrato}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600"
                  >
                    ↓ Contrato
                  </a>
                )}
                {contrato.link_documento_moto && (
                  <a
                    href={contrato.link_documento_moto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600"
                  >
                    ↓ Doc
                  </a>
                )}
                {!contrato.link_contrato && !contrato.link_documento_moto && (
                  <span className="text-xs text-zinc-300">—</span>
                )}
              </span>
            </div>
          )
        })}

        <Paginacao total={cliente.contratos.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
      </div>

      <div className="h-8" />
    </div>
  )
}
