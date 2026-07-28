import { useState } from 'react'
import type { Cliente, OSSimples } from '@/types/cliente'
import { OSModal } from '@/components/portal/OSModal'
import { PagamentoModal } from '@/components/portal/PagamentoModal'
import { LoadingModal } from '@/components/portal/LoadingModal'
import { resolverStatusParcela } from '@/utils/parcela'
import { useCountUp } from '@/hooks/useCountUp'
import { Paginacao } from '@/components/portal/Paginacao'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'
import { abrirLink } from '@/lib/abrir-link'

function formatarData(iso: string) {
  const [, mes, dia] = iso.split('-')
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${parseInt(dia)} ${meses[parseInt(mes) - 1]}`
}

function formatarMoeda(valor: number) {
  const [int, dec] = valor.toFixed(2).split('.')
  return 'R$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec
}

interface Props {
  cliente: Cliente
}

export function ProximosPagamentos({ cliente }: Props) {
  const emAberto = cliente.parcelas
    .filter((p) => {
      const s = resolverStatusParcela(p.status, p.vencimento)
      return s === 'atrasada' || s === 'a_vencer'
    })
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))

  const atrasadas = cliente.parcelas.filter((p) => resolverStatusParcela(p.status, p.vencimento) === 'atrasada')
  const proxima = emAberto[0] ?? null

  const [osAberta, setOsAberta] = useState<OSSimples | null>(null)
  const [osLoadingId, setOsLoadingId] = useState<string | null>(null)
  const [pagLoadingId, setPagLoadingId] = useState<string | null>(null)
  const [pagamento, setPagamento] = useState<{
    image: string
    payload: string
    descricao: string
    expiracao: string
    valor: number
  } | null>(null)
  const [pagina, setPagina] = useState(1)

  const POR_PAGINA = 10
  const atrasadasCount = useCountUp(atrasadas.length)
  const itensPagina = emAberto.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  async function abrirPagamento(id_pay: string, parcelaId: string, valor: number) {
    setPagLoadingId(parcelaId)
    try {
      const placa = cliente.contratos[0]?.veiculo.placa ?? ''
      const url = `${BUBBLE_BASE_URL}/consultar_link_de_pagamento`
      const body = { apikey: BUBBLE_API_KEY, id_pay, placa }
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
        return
      }
      if (res.ok && data.status === 'success') {
        setPagamento({ ...data.response, valor })
      } else {
        console.warn('[PAGAMENTO] falhou:', data)
      }
    } catch (err) {
      console.error('[PAGAMENTO] ERRO DE REDE', err)
    } finally {
      setPagLoadingId(null)
    }
  }

  async function abrirOS(lancamento_id: string, parcelaId: string, valor: number) {
    setOsLoadingId(parcelaId)
    try {
      const url = `${BUBBLE_BASE_URL}/chamar-os`
      const body = { lancamento: lancamento_id, apikey: BUBBLE_API_KEY }
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
        return
      }
      if (!res.ok || data.status !== 'success') {
        console.warn('[OS] falhou:', data)
        return
      }
      const os = data.response?.os
      if (!os) return
      const tipoMap: Record<string, string> = {
        'OS SIMPLES': 'OS Simples',
        'OS DE GUINCHO': 'OS de Guincho',
        'OS DE VENDA': 'OS de Venda',
        'OS DE LIBERAÇÃO': 'OS de Liberação',
      }
      setOsAberta({
        tipo: (tipoMap[os['tipos de os']] as OSSimples['tipo']) ?? os['tipos de os'],
        numero: String(os['numero os']),
        data_hora: new Date(os['data e hora']).toISOString(),
        placa: os.placa,
        km: os.km,
        itens: [],
        valor,
      })
    } catch (err) {
      console.error('[OS] ERRO DE REDE', err)
    } finally {
      setOsLoadingId(null)
    }
  }

  return (
    <div className="overflow-y-auto px-4">
      {osAberta && <OSModal os={osAberta} onClose={() => setOsAberta(null)} />}
      {pagLoadingId && <LoadingModal />}
      {pagamento && <PagamentoModal dados={pagamento} onClose={() => setPagamento(null)} />}

      <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Próximos pagamentos</h2>

      {atrasadas.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <p className="text-[13px] font-medium text-[#991B1B]">
            ⚠️ Você possui {atrasadas.length} parcela{atrasadas.length > 1 ? 's' : ''} em atraso. Regularize para
            evitar juros.
          </p>
        </div>
      )}

      <div className="mb-3 flex gap-3">
        <div className="flex-1 rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Próximo vencimento</p>
          <p className="text-xl font-bold text-zinc-900">{proxima ? formatarData(proxima.vencimento) : '—'}</p>
        </div>
        <div className="flex-1 rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Valor a pagar</p>
          <p className="text-xl font-bold text-zinc-900">{proxima ? formatarMoeda(proxima.valor) : '—'}</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Em atraso</p>
        <p className="text-xl font-bold text-danger">
          {Math.round(atrasadasCount)} parcela{atrasadas.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex bg-[#0d1b2a] px-3 py-2.5">
          <span className="flex-[1.2] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Vencimento</span>
          <span className="flex-[1.2] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Valor</span>
          <span className="flex-[0.8] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Link</span>
          <span className="flex-[0.8] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Ações</span>
        </div>

        {itensPagina.map((p) => (
          <div key={p.numero} className="flex items-center border-b border-zinc-100 px-3 py-3">
            <span className="flex-[1.2] text-xs text-zinc-600">{p.vencimento.split('-').reverse().join('/')}</span>
            <span className="flex-[1.2] text-xs font-semibold text-zinc-600">{formatarMoeda(p.valor)}</span>
            <span className="flex-[0.8]">
              {p.link_pagamento ? (
                <button onClick={() => abrirLink(p.link_pagamento!)} className="text-xs font-semibold text-accent">
                  Acessar
                </button>
              ) : p.id_pay ? (
                <button
                  onClick={() => abrirPagamento(p.id_pay!, String(p.numero), p.valor)}
                  disabled={pagLoadingId === String(p.numero)}
                  className="text-xs font-semibold text-accent disabled:opacity-50"
                >
                  {pagLoadingId === String(p.numero) ? '...' : 'Acessar'}
                </button>
              ) : (
                <span className="text-xs text-zinc-300">—</span>
              )}
            </span>
            <span className="flex-[0.8]">
              {p.tipo === 'OS' && p.lancamento_id ? (
                <button
                  onClick={() => abrirOS(p.lancamento_id!, String(p.numero), p.valor)}
                  disabled={osLoadingId === String(p.numero)}
                  className="rounded-md bg-accent-light px-2 py-1 text-[11px] font-semibold text-accent disabled:opacity-50"
                >
                  {osLoadingId === String(p.numero) ? '...' : 'OS'}
                </button>
              ) : (
                <span className="text-xs text-zinc-300">—</span>
              )}
            </span>
          </div>
        ))}

        <Paginacao total={emAberto.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
      </div>

      <div className="h-8" />
    </div>
  )
}
