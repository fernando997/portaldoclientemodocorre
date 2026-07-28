import { useState, useEffect } from 'react'
import type { Cliente } from '@/types/cliente'
import { useAuthStore } from '@/store/auth'
import { Paginacao } from '@/components/portal/Paginacao'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'

function formatarMoeda(valor: number) {
  const [int, dec] = valor.toFixed(2).split('.')
  return 'R$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec
}

interface Props {
  cliente: Cliente
}

export function TabelaTarifaria({ cliente }: Props) {
  const setCliente = useAuthStore((s) => s.setCliente)
  const [pagina, setPagina] = useState(1)
  const jaTemDados = cliente.tabela_tarifaria.length > 0
  const [itens, setItens] = useState(cliente.tabela_tarifaria)
  const [carregando, setCarregando] = useState(!jaTemDados)
  const [erro, setErro] = useState<string | null>(null)
  const POR_PAGINA = 10
  const itensPagina = itens.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  useEffect(() => {
    if (jaTemDados) return

    async function buscar() {
      try {
        setCarregando(true)
        setErro(null)
        const url = `${BUBBLE_BASE_URL}/portal-cliente_tarifario`
        const body = { cliente: cliente.id, apikey: BUBBLE_API_KEY }
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
          throw new Error(data.message ?? 'Erro ao buscar tabela tarifária')
        }
        const lista = (data.response.tarifario ?? []).map((item: any) => ({
          servico: item.descricao,
          valor: item.valor,
        }))
        setItens(lista)
        setCliente({ ...cliente, tabela_tarifaria: lista })
      } catch (err: any) {
        console.error('[TARIFARIO] ERRO', err)
        setErro(err.message ?? 'Erro ao carregar tabela tarifária.')
      } finally {
        setCarregando(false)
      }
    }
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overflow-y-auto px-4">
      <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Tabela tarifária</h2>

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
          <div className="flex bg-[#0d1b2a] px-3 py-2.5">
            <span className="flex-[2] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Descrição</span>
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Valor</span>
          </div>

          {itensPagina.map((item, i) => (
            <div key={i} className="flex items-center border-b border-zinc-100 px-3 py-3">
              <span className="flex-[2] text-[13px] font-semibold text-zinc-600">{item.servico}</span>
              <span className="flex-1 text-[13px] text-zinc-600">{formatarMoeda(item.valor)}</span>
            </div>
          ))}

          {itens.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-[13px] text-zinc-400">Nenhum item encontrado.</p>
            </div>
          )}

          <Paginacao total={itens.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
