import { useState, useEffect } from 'react'
import type { Cliente } from '@/types/cliente'
import { useAuthStore } from '@/store/auth'
import { Paginacao } from '@/components/portal/Paginacao'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'

function formatarData(iso: string) {
  return iso.split('-').reverse().join('/')
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  cliente: Cliente
}

export function Multas({ cliente }: Props) {
  const setCliente = useAuthStore((s) => s.setCliente)
  const [pagina, setPagina] = useState(1)
  const jaTemDados = cliente.multas.length > 0
  const [carregando, setCarregando] = useState(!jaTemDados)
  const [erro, setErro] = useState<string | null>(null)
  const POR_PAGINA = 10
  const ordenadas = [...cliente.multas].sort((a, b) => b.data_cadastro.localeCompare(a.data_cadastro))
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
          throw new Error(data.message ?? 'Erro ao buscar multas')
        }

        const multas = (data.response.multas ?? []).map((m: any) => ({
          id: m._id,
          ait: m.ait ?? '',
          data_cadastro: new Date(m.data_cadastro).toISOString().split('T')[0],
          valor: parseFloat(m.valor_bruto) || 0,
        }))

        setCliente({ ...cliente, multas })
      } catch (err: any) {
        console.error('[MULTAS] ERRO', err)
        setErro(err.message ?? 'Erro ao carregar multas.')
      } finally {
        setCarregando(false)
      }
    }
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overflow-y-auto px-4">
      <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Multas</h2>

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
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">AIT</span>
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Cadastro</span>
            <span className="flex-1 text-right text-[9px] font-semibold uppercase tracking-wide text-zinc-300">
              Valor
            </span>
          </div>

          {itensPagina.map((m) => (
            <div key={m.id} className="flex items-center border-b border-zinc-100 px-3 py-3">
              <span className="flex-1 text-xs text-zinc-600">{m.ait || '—'}</span>
              <span className="flex-1 text-xs text-zinc-600">{formatarData(m.data_cadastro)}</span>
              <span className="flex-1 text-right text-xs font-semibold text-zinc-600">{formatarMoeda(m.valor)}</span>
            </div>
          ))}

          {ordenadas.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-[13px] text-zinc-400">Nenhuma multa encontrada.</p>
            </div>
          )}

          <Paginacao total={ordenadas.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
