import { useState, useEffect } from 'react'
import type { Cliente } from '@/types/cliente'
import { useAuthStore } from '@/store/auth'
import { Paginacao } from '@/components/portal/Paginacao'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'

function formatarData(iso: string) {
  return iso.split('-').reverse().join('/')
}

interface Props {
  cliente: Cliente
}

export function Vistorias({ cliente }: Props) {
  const setCliente = useAuthStore((s) => s.setCliente)
  const [pagina, setPagina] = useState(1)
  const jaTemDados = cliente.vistorias.length > 0
  const [carregando, setCarregando] = useState(!jaTemDados)
  const [erro, setErro] = useState<string | null>(null)
  const POR_PAGINA = 10
  const placa = cliente.contratos[0]?.veiculo.placa ?? ''
  const concluidas = [...cliente.vistorias].filter((v) => v.status === 'concluida').reverse()
  const itensPagina = concluidas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

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
          throw new Error(data.message ?? 'Erro ao buscar vistorias')
        }

        const vistorias = (data.response.vistoria ?? []).map((v: any) => ({
          id: v._id,
          contrato: v.contrato,
          data: new Date(v.data).toISOString().split('T')[0],
          placa,
          tipo: v.tipo,
          responsavel: v.vistoriador ?? '',
          status: 'concluida' as const,
          observacoes: null,
          link_pdf: v.vistoria_pdf ? `https:${v.vistoria_pdf}` : null,
        }))

        const fastVistorias = (data.response.fast_vistoria ?? []).map((v: any) => ({
          id: v._id,
          contrato: v.contrato,
          data: new Date(v.data).toISOString().split('T')[0],
          placa,
          tipo: 'AUTO INSPEÇÃO',
          responsavel: '',
          status: 'concluida' as const,
          observacoes: null,
          link_pdf: null,
          midias: [v.autoInspecao_video, v.autoInspecao_fototraseira, v.autoInspecao_selfie].filter(Boolean) as string[],
        }))

        const todas = [...vistorias, ...fastVistorias].sort((a, b) => b.data.localeCompare(a.data))
        setCliente({ ...cliente, vistorias: todas })
      } catch (err: any) {
        console.error('[VISTORIAS] ERRO', err)
        setErro(err.message ?? 'Erro ao carregar vistorias.')
      } finally {
        setCarregando(false)
      }
    }
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overflow-y-auto px-4">
      <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Vistorias</h2>

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
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Data</span>
            <span className="w-[70px] text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Placa</span>
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Tipo</span>
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">Ações</span>
          </div>

          {itensPagina.map((v) => (
            <div key={v.id} className="flex items-center border-b border-zinc-100 px-3 py-3">
              <span className="flex-1 text-xs text-zinc-600">{formatarData(v.data)}</span>
              <span className="w-[70px] text-xs text-zinc-600">{v.placa}</span>
              <span className="flex-1 text-xs text-zinc-600">{v.tipo}</span>
              <span className="flex-1">
                {v.link_pdf ? (
                  <a
                    href={v.link_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600"
                  >
                    ↓ PDF
                  </a>
                ) : v.midias && v.midias.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {v.midias.map((m, i) => (
                      <a
                        key={i}
                        href={m}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600"
                      >
                        ↓ Mídia {i + 1}
                      </a>
                    ))}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-300">—</span>
                )}
              </span>
            </div>
          ))}

          {concluidas.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-[13px] text-zinc-400">Nenhuma vistoria encontrada.</p>
            </div>
          )}

          <Paginacao total={concluidas.length} pagina={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
