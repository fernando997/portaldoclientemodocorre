import { useEffect, useRef, useState } from 'react'
import { buscarStatusFila, type StatusFila } from '@/lib/buscar-fila'
import { mostrarNotificacaoNativa } from '@/lib/notificacao-nativa'

// Intervalo curto porque a fila anda em minutos: o cliente precisa ver a
// posição mudar enquanto espera. O sino do SAC usa 3 min, que aqui seria
// lento demais.
const INTERVALO_MS = 20 * 1000

// A partir desta posição a tela entra em alerta e dispara a notificação.
export const POSICAO_ALERTA = 3

// Somente leitura: o portal acompanha a fila, mas não coloca mais ninguém
// nela. Entrar exige provar presença na base por GPS, e o portal não pede
// mais localização -- isso passou a ser exclusividade do aplicativo nativo.
// Quem já está na fila continua vendo posição, chamada e atendimento aqui.
export interface FilaOleo {
  status: StatusFila | null
  carregando: boolean
  erro: string | null
}

// Um único polling no portal alimenta a tela da fila e o banner do topo.
// Dois intervalos independentes dobrariam as chamadas e poderiam divergir.
export function useFilaOleo(contratoId: string | undefined): FilaOleo {
  const [status, setStatus] = useState<StatusFila | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Id da entrada para a qual já avisamos, para a notificação sair uma vez só
  const avisadoRef = useRef<string | null>(null)

  useEffect(() => {
    if (!contratoId) {
      setStatus(null)
      return
    }
    let ativo = true
    avisadoRef.current = null

    async function atualizar(primeira: boolean) {
      if (primeira) setCarregando(true)
      try {
        const s = await buscarStatusFila(contratoId!)
        if (!ativo) return
        setStatus(s)
        setErro(null)
        const entrada = s.entrada
        if (!entrada) {
          avisadoRef.current = null
        } else if (
          entrada.status === 'AGUARDANDO' &&
          s.posicao > 0 &&
          s.posicao <= POSICAO_ALERTA &&
          avisadoRef.current !== entrada.id
        ) {
          avisadoRef.current = entrada.id
          mostrarNotificacaoNativa(
            'Sua vez está chegando',
            `Você é o ${s.posicao}º na fila de troca de óleo. Prepare-se para levar a moto.`,
            `fila-oleo-${entrada.id}`
          )
        }
      } catch (err: any) {
        console.error('[FILA ÓLEO] erro ao consultar', err)
        if (ativo && primeira) setErro(err.message ?? 'Erro ao consultar a fila.')
      } finally {
        if (ativo && primeira) setCarregando(false)
      }
    }

    atualizar(true)
    const timer = setInterval(() => atualizar(false), INTERVALO_MS)
    return () => {
      ativo = false
      clearInterval(timer)
    }
  }, [contratoId])

  return { status, carregando, erro }
}
