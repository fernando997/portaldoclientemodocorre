import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Cliente, ItemListagemPlano } from '@/types/cliente'
import { Paginacao } from '@/components/portal/Paginacao'
import { buscarListagemPlanos } from '@/lib/buscar-planos-manutencao'
import {
  filtrarListagem,
  situacaoDoPlano,
  type FiltroListagem,
  type TipoSituacao,
} from '@/lib/regra-planos-manutencao'

const POR_PAGINA = 10

const FILTROS: { id: FiltroListagem; label: string; titulo: string }[] = [
  { id: 'TODOS', label: 'Todos', titulo: 'Todos os planos' },
  { id: 'NAO REALIZADO', label: 'Não realizados', titulo: 'Planos não realizados' },
  { id: 'REALIZADO', label: 'Realizados', titulo: 'Planos realizados' },
]

const corSituacao: Record<TipoSituacao, { color: string; bg: string }> = {
  concluida: { color: '#15803d', bg: '#dcfce7' },
  'na-hora': { color: '#92400e', bg: '#fef3c7' },
  os: { color: '#1d4ed8', bg: '#dbeafe' },
  vencida: { color: '#dc2626', bg: '#fee2e2' },
  faltam: { color: '#71717a', bg: '#f4f4f5' },
}

function formatarKm(km: number) {
  return km.toLocaleString('pt-BR')
}

interface Props {
  cliente: Cliente
  onVoltar: () => void
}

export function PlanosManutencao({ cliente, onVoltar }: Props) {
  const contrato = cliente.contratos[0]
  const contratoId = contrato?.id
  const [listagem, setListagem] = useState<{ kmMoto: number; itens: ItemListagemPlano[] } | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroListagem>('TODOS')
  // null = página da próxima manutenção (o cliente não precisa passar pelas realizadas)
  const [paginaEscolhida, setPaginaEscolhida] = useState<number | null>(null)

  // A listagem é sempre da moto do contrato selecionado: troca de contrato busca de novo
  useEffect(() => {
    if (!contratoId) {
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)
    setListagem(null)
    setPaginaEscolhida(null)
    buscarListagemPlanos(contratoId)
      .then((r) => {
        if (!cancelado) setListagem(r)
      })
      .catch((err: any) => {
        console.error('[PLANOS DE MANUTENÇÃO] ERRO', err)
        if (!cancelado) setErro(err.message ?? 'Erro ao carregar planos de manutenção.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [contratoId])

  const kmMoto = listagem?.kmMoto ?? 0
  const { itens, pendentes, proxima } = filtrarListagem(listagem?.itens ?? [], kmMoto, filtro)
  const indiceProxima = proxima ? itens.indexOf(proxima) : -1
  const pagina = paginaEscolhida ?? (indiceProxima >= 0 ? Math.floor(indiceProxima / POR_PAGINA) + 1 : 1)
  const itensPagina = itens.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const tituloLista = FILTROS.find((f) => f.id === filtro)?.titulo ?? ''

  function trocarFiltro(novo: FiltroListagem) {
    setFiltro(novo)
    setPaginaEscolhida(null)
  }

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
        <>
          <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4">
            {contrato && (
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-md border-2 border-zinc-900 bg-zinc-50 px-2 py-0.5 text-[15px] font-bold tracking-widest text-zinc-900">
                  {contrato.veiculo.placa}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-zinc-700">
                  {[contrato.veiculo.marca, contrato.veiculo.modelo].filter(Boolean).join(' ')}
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[11px] text-zinc-500">Km atual</p>
                <p className="text-lg font-bold tabular-nums text-zinc-900">{formatarKm(kmMoto)}</p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-500">Pendentes</p>
                <p className="text-lg font-bold tabular-nums text-zinc-900">{pendentes}</p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-500">Próxima (km)</p>
                <p className="text-lg font-bold tabular-nums text-zinc-900">{proxima ? formatarKm(proxima.km) : '—'}</p>
              </div>
            </div>
          </div>

          <div className="mb-3 flex gap-1 rounded-xl bg-zinc-100 p-1">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => trocarFiltro(f.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                  filtro === f.id ? 'bg-accent text-white' : 'text-zinc-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-baseline justify-between px-1">
            <span className="text-sm font-bold text-zinc-900">{tituloLista}</span>
            {itens.length > 0 && (
              <span className="text-xs text-zinc-400">
                {itens.length} {itens.length === 1 ? 'plano' : 'planos'}
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {itensPagina.map((p, i) => {
              const situacao = situacaoDoPlano(p, kmMoto)
              const cor = corSituacao[situacao.tipo]
              const ehProxima = p === proxima
              const isLast = i === itensPagina.length - 1
              return (
                <div
                  key={p.id}
                  className={`flex gap-3 p-4 ${isLast ? '' : 'border-b border-zinc-100'} ${ehProxima ? 'bg-accent-light' : ''}`}
                >
                  <div className="w-[60px] shrink-0 text-right">
                    <p className="text-base font-bold leading-tight tabular-nums text-zinc-900">{formatarKm(p.km)}</p>
                    <p className="text-[10px] font-semibold text-zinc-400">KM</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900">{p.nome || 'Plano de manutenção'}</p>
                    <p className="mb-1.5 text-xs text-zinc-500">Prevista para {formatarKm(p.km)} km</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ehProxima && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                          Próxima manutenção
                        </span>
                      )}
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: cor.bg, color: cor.color }}
                      >
                        {situacao.texto}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {itens.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-[13px] text-zinc-400">Nenhum plano encontrado para esta opção.</p>
              </div>
            )}

            <Paginacao total={itens.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPaginaEscolhida} />
          </div>
        </>
      )}

      <div className="h-8" />
    </div>
  )
}
