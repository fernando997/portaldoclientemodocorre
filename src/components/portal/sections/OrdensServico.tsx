import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import type { Cliente } from '@/types/cliente'
import { useAuthStore } from '@/store/auth'
import { Paginacao } from '@/components/portal/Paginacao'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'
import { abrirPopup } from '@/lib/abrir-link'

const OS_VIEWER_BASE_URL = 'https://modocorreapp.com.br/ordem_de_servico'

function formatarData(iso: string) {
  if (!iso) return '—'
  const [data, hora] = iso.split('T')
  const dataFmt = data.split('-').reverse().join('/')
  return hora ? `${dataFmt} ${hora.slice(0, 5)}` : dataFmt
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  CONCLUIDA: { color: '#15803d', bg: '#dcfce7' },
  CONCLUÍDA: { color: '#15803d', bg: '#dcfce7' },
  ABERTA: { color: '#92400e', bg: '#fef3c7' },
  'EM ANDAMENTO': { color: '#92400e', bg: '#fef3c7' },
  CANCELADA: { color: '#dc2626', bg: '#fee2e2' },
}

interface Props {
  cliente: Cliente
}

export function OrdensServico({ cliente }: Props) {
  const setCliente = useAuthStore((s) => s.setCliente)
  const [pagina, setPagina] = useState(1)
  const jaTemDados = (cliente.ordens_servico ?? []).length > 0
  const [carregando, setCarregando] = useState(!jaTemDados)
  const [erro, setErro] = useState<string | null>(null)
  const POR_PAGINA = 10
  const ordenadas = [...(cliente.ordens_servico ?? [])].sort((a, b) => b.data_hora.localeCompare(a.data_hora))
  const itensPagina = ordenadas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  useEffect(() => {
    if (jaTemDados) return

    async function buscar() {
      try {
        setCarregando(true)
        setErro(null)
        const contratoId = cliente.contratos[0]?.id
        const url = `${BUBBLE_BASE_URL}/portal-cliente_vistorias`
        const body = { contrato: contratoId, apikey: BUBBLE_API_KEY }
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const text = await res.text()
        let data: any
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error('Resposta inválida')
        }
        if (!res.ok || data.status !== 'success') {
          throw new Error(data.message ?? 'Erro ao buscar ordens de serviço')
        }

        const fornecedores: any[] = data.response.fornecedor ?? []
        const nomeFornecedor = (id: string) => fornecedores.find((f) => f._id === id)?.nome ?? ''

        const ordens = (data.response.ordens_servico ?? []).map((o: any) => ({
          id: o._id,
          numero: o['numero os'],
          data_hora: o['data e hora'] ? new Date(o['data e hora']).toISOString() : '',
          tipo: o['tipos de os'] ?? '',
          fornecedor: nomeFornecedor(o.fornecedor_atrelado),
          status: o['status da os'] ?? '',
          km: o.km ?? 0,
        }))

        setCliente({ ...cliente, ordens_servico: ordens })
      } catch (err: any) {
        console.error('[ORDENS DE SERVIÇO] ERRO', err)
        setErro(err.message ?? 'Erro ao carregar ordens de serviço.')
      } finally {
        setCarregando(false)
      }
    }
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overflow-y-auto px-4">
      <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Ordens de serviço</h2>

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
          {itensPagina.map((os, i) => {
            const cfg = statusConfig[os.status.toUpperCase()] ?? { color: '#71717a', bg: '#f4f4f5' }
            const isLast = i === itensPagina.length - 1
            return (
              <div key={os.id} className={`p-4 ${isLast ? '' : 'border-b border-zinc-100'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-900">OS #{os.numero}</span>
                  {os.status && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {os.status}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                    <span>{formatarData(os.data_hora)}</span>
                    {os.tipo && <span>{os.tipo}</span>}
                    {os.fornecedor && <span>{os.fornecedor}</span>}
                    {os.km > 0 && <span>{os.km.toLocaleString('pt-BR')} km</span>}
                  </div>
                  <button
                    onClick={() => abrirPopup(`${OS_VIEWER_BASE_URL}?os=${os.id}`)}
                    className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600"
                  >
                    <Eye size={11} />
                    Visualizar
                  </button>
                </div>
              </div>
            )
          })}

          {ordenadas.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-[13px] text-zinc-400">Nenhuma ordem de serviço encontrada.</p>
            </div>
          )}

          <Paginacao total={ordenadas.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
