import { useState, useEffect } from 'react'
import { Headset, CheckCircle2, Clock3 } from 'lucide-react'
import type { Cliente, Ticket } from '@/types/cliente'
import { useAuthStore } from '@/store/auth'
import { Paginacao } from '@/components/portal/Paginacao'
import { buscarTickets } from '@/lib/buscar-tickets'

// O Bubble grava o status em snake_case; aqui vira rótulo legível.
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; emAberto: boolean }> = {
  ABERTO: { label: 'Aberto', color: '#1d4ed8', bg: '#dbeafe', emAberto: true },
  EM_ANDAMENTO: { label: 'Em andamento', color: '#92400e', bg: '#fef3c7', emAberto: true },
  AGUARDANDO: { label: 'Aguardando retorno', color: '#92400e', bg: '#fef3c7', emAberto: true },
  ENCERRADO: { label: 'Encerrado', color: '#15803d', bg: '#dcfce7', emAberto: false },
  CANCELADO: { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2', emAberto: false },
}

function configDoStatus(status: string) {
  const chave = status.trim().toUpperCase().replace(/\s+/g, '_')
  return (
    STATUS_CONFIG[chave] ?? {
      label: status ? status.replace(/_/g, ' ') : 'Sem status',
      color: '#71717a',
      bg: '#f4f4f5',
      emAberto: false,
    }
  )
}

function formatarDataHora(ts: number | null) {
  if (!ts) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

interface Props {
  cliente: Cliente
}

export function Tickets({ cliente }: Props) {
  const setCliente = useAuthStore((s) => s.setCliente)
  const [pagina, setPagina] = useState(1)
  const jaTemDados = (cliente.tickets ?? []).length > 0
  const [carregando, setCarregando] = useState(!jaTemDados)
  const [erro, setErro] = useState<string | null>(null)
  const POR_PAGINA = 10

  const tickets = cliente.tickets ?? []
  const emAberto = tickets.filter((t) => configDoStatus(t.status).emAberto)
  const itensPagina = tickets.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  useEffect(() => {
    if (jaTemDados) return

    async function buscar() {
      try {
        setCarregando(true)
        setErro(null)
        const contratoId = cliente.contratos[0]?.id
        const lista = await buscarTickets(contratoId ?? '')
        setCliente({ ...cliente, tickets: lista })
      } catch (err: any) {
        console.error('[TICKETS] ERRO', err)
        setErro(err.message ?? 'Erro ao carregar os tickets.')
      } finally {
        setCarregando(false)
      }
    }
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overflow-y-auto px-4">
      <h2 className="mb-1 mt-2 text-xl font-bold text-zinc-900">Tickets</h2>
      <p className="mb-4 text-[13px] text-text-muted">Acompanhe os seus atendimentos com o nosso time.</p>

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
        <>
          {tickets.length > 0 && (
            <div className="mb-4 flex gap-3">
              <div className="flex-1 rounded-2xl border border-l-[3px] border-border border-l-accent bg-white p-4">
                <div className="mb-2.5 flex items-center gap-1.5">
                  <Clock3 size={18} className="text-accent" />
                  <span className="text-[11px] font-medium text-text-muted">Em aberto</span>
                </div>
                <p className="text-2xl font-bold tracking-tight text-text-body">{emAberto.length}</p>
              </div>
              <div className="flex-1 rounded-2xl border border-l-[3px] border-border border-l-accent bg-white p-4">
                <div className="mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 size={18} className="text-accent" />
                  <span className="text-[11px] font-medium text-text-muted">Total</span>
                </div>
                <p className="text-2xl font-bold tracking-tight text-text-body">{tickets.length}</p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {itensPagina.map((t: Ticket, i) => {
              const cfg = configDoStatus(t.status)
              const isLast = i === itensPagina.length - 1
              return (
                <div key={t.id} className={`p-4 ${isLast ? '' : 'border-b border-zinc-100'}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Protocolo</p>
                      <p className="truncate text-sm font-bold text-zinc-900">{t.protocolo || '—'}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {(t.assunto || t.canal) && (
                    <p className="mb-1.5 text-[13px] text-zinc-700">
                      {t.assunto || 'Atendimento'}
                      {t.canal && <span className="text-zinc-400"> · {t.canal}</span>}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                    <span>Aberto em {formatarDataHora(t.abertura_ts) || '—'}</span>
                    {t.encerramento_ts && <span>Encerrado em {formatarDataHora(t.encerramento_ts)}</span>}
                    {t.retorno_em_ts && <span>Retorno previsto {formatarDataHora(t.retorno_em_ts)}</span>}
                  </div>

                  {t.desfecho && (
                    <p className="mt-2 rounded-lg bg-accent-light px-2.5 py-1.5 text-[11px] font-semibold text-accent">
                      {t.desfecho}
                    </p>
                  )}
                  {t.retorno_obs && <p className="mt-1.5 text-[11px] text-zinc-500">{t.retorno_obs}</p>}
                </div>
              )
            })}

            {tickets.length === 0 && (
              <div className="flex flex-col items-center gap-2.5 py-10">
                <Headset size={30} className="text-border" />
                <p className="text-[13px] text-zinc-400">Nenhum atendimento registrado.</p>
              </div>
            )}

            <Paginacao total={tickets.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
          </div>
        </>
      )}

      <div className="h-8" />
    </div>
  )
}
