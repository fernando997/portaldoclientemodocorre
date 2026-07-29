import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Cliente } from '@/types/cliente'
import { useAuthStore } from '@/store/auth'
import { Paginacao } from '@/components/portal/Paginacao'
import { buscarPlanosManutencao } from '@/lib/buscar-planos-manutencao'

function formatarData(iso: string) {
  if (!iso) return '—'
  return iso.split('-').reverse().join('/')
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  REALIZADO: { color: '#15803d', bg: '#dcfce7' },
  PENDENTE: { color: '#92400e', bg: '#fef3c7' },
  AGENDADO: { color: '#92400e', bg: '#fef3c7' },
  CANCELADO: { color: '#dc2626', bg: '#fee2e2' },
}

interface Props {
  cliente: Cliente
  onVoltar: () => void
}

export function PlanosManutencao({ cliente, onVoltar }: Props) {
  const setCliente = useAuthStore((s) => s.setCliente)
  const [pagina, setPagina] = useState(1)
  const jaTemDados = (cliente.planos_manutencao ?? []).length > 0
  const [carregando, setCarregando] = useState(!jaTemDados)
  const [erro, setErro] = useState<string | null>(null)
  const POR_PAGINA = 10
  const ordenados = [...(cliente.planos_manutencao ?? [])].sort((a, b) => a.km - b.km)
  const itensPagina = ordenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  useEffect(() => {
    if (jaTemDados) return

    async function buscar() {
      try {
        setCarregando(true)
        setErro(null)
        const contratoId = cliente.contratos[0]?.id
        const planos = await buscarPlanosManutencao(contratoId ?? '')
        setCliente({ ...cliente, planos_manutencao: planos })
      } catch (err: any) {
        console.error('[PLANOS DE MANUTENÇÃO] ERRO', err)
        setErro(err.message ?? 'Erro ao carregar planos de manutenção.')
      } finally {
        setCarregando(false)
      }
    }
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overflow-y-auto px-4">
      <button onClick={onVoltar} className="mb-3 mt-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-500">
        <ArrowLeft size={16} />
        Voltar
      </button>

      <h2 className="mb-4 text-xl font-bold text-zinc-900">Planos de manutenção</h2>

      {carregando && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
          <p className="text-sm text-zinc-400">Carregando...</p>
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-[13px] text-danger">{erro}</p>
        </div>
      )}

      {!carregando && !erro && (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {itensPagina.map((p, i) => {
            const cfg = statusConfig[p.status.toUpperCase()] ?? { color: '#71717a', bg: '#f4f4f5' }
            const isLast = i === itensPagina.length - 1
            return (
              <div key={p.id} className={`p-4 ${isLast ? '' : 'border-b border-zinc-100'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-900">{p.plano_nome || 'Plano de manutenção'}</span>
                  {p.status && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {p.status}
                    </span>
                  )}
                </div>
                {p.descricao && <p className="mb-1.5 text-xs text-zinc-600">{p.descricao}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span>{formatarData(p.data)}</span>
                  {p.km > 0 && <span>{p.km.toLocaleString('pt-BR')} km</span>}
                </div>
              </div>
            )
          })}

          {ordenados.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-[13px] text-zinc-400">Nenhum plano de manutenção encontrado.</p>
            </div>
          )}

          <Paginacao total={ordenados.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
