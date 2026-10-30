import { useCallback, useEffect, useRef, useState } from 'react'
import { buscarStatusFila, entrarNaFila, type StatusFila } from '@/lib/buscar-fila'
import { distanciaEmMetros, pontoValido } from '@/lib/geo'
import {
  obterPosicaoAtual,
  verificarPermissaoLocalizacao,
  registrarLocalizacao,
} from '@/services/localizacao'
import { mostrarNotificacaoNativa } from '@/lib/notificacao-nativa'
import { showToast } from '@/components/Toast'

// Intervalo curto porque a fila anda em minutos: o cliente precisa ver a
// posição mudar enquanto espera. O sino do SAC usa 3 min, que aqui seria
// lento demais.
const INTERVALO_MS = 20 * 1000

// A partir desta posição a tela entra em alerta e dispara a notificação.
export const POSICAO_ALERTA = 3

export interface FilaOleo {
  status: StatusFila | null
  carregando: boolean
  erro: string | null
  entrando: boolean
  // Distância até a base, medida assim que a OS elegível aparece. null = ainda
  // não sabemos (sem permissão, GPS falhou ou ainda não perguntamos).
  distancia: number | null
  entrar: () => void
}

export function formatarMetros(m: number) {
  if (m >= 1000) return `${(m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`
  return `${Math.round(m)} m`
}

// Um único polling no portal alimenta a tela da fila e o banner do topo.
// Dois intervalos independentes dobrariam as chamadas e poderiam divergir.
export function useFilaOleo(contratoId: string | undefined): FilaOleo {
  const [status, setStatus] = useState<StatusFila | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)
  const [distancia, setDistancia] = useState<number | null>(null)
  const entrandoRef = useRef(false)
  // Contrato+OS para os quais já pedimos a localização, para não repetir a
  // cada ciclo do polling
  const localPedidoRef = useRef<string | null>(null)
  // Id da entrada para a qual já avisamos, para a notificação sair uma vez só
  const avisadoRef = useRef<string | null>(null)

  useEffect(() => {
    if (!contratoId) {
      setStatus(null)
      return
    }
    let ativo = true
    avisadoRef.current = null
    localPedidoRef.current = null
    setDistancia(null)

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

  // Assim que existe OS de óleo elegível e o cliente ainda não está na fila,
  // pede a localização já — para ele ver a distância antes de tentar entrar, e
  // para registrar a passagem dele pela base.
  useEffect(() => {
    if (!contratoId || !status || status.entrada || !status.osElegivel) return
    const base = status.base
    if (!pontoValido(base)) return

    const chave = contratoId + '|' + status.osElegivel.id
    if (localPedidoRef.current === chave) return
    localPedidoRef.current = chave

    void (async () => {
      const permissao = await verificarPermissaoLocalizacao()
      // Bloqueada de vez: não insiste aqui — o toque no botão explica como reativar
      if (permissao === 'denied') return
      try {
        const pos = await obterPosicaoAtual()
        setDistancia(
          distanciaEmMetros({ lat: pos.coords.latitude, long: pos.coords.longitude }, base)
        )
        void registrarLocalizacao(contratoId, pos, 'da fila de óleo')
      } catch (err) {
        console.warn('[FILA ÓLEO] localização não obtida na abertura', err)
      }
    })()
  }, [contratoId, status])

  // Espelha solicitarDesbloqueio: reconfere antes de gravar, trata `denied`
  // separado de "ainda não perguntou", e só grava com posição em mãos.
  const entrar = useCallback(() => {
    if (!contratoId || entrandoRef.current) return
    entrandoRef.current = true
    setEntrando(true)

    void (async () => {
      try {
        // Reconfere no clique: evita entrada duplicada se a fila mudou e a
        // tela ainda não atualizou.
        const atual = await buscarStatusFila(contratoId)
        setStatus(atual)

        if (atual.entrada) {
          showToast('info', 'Você já está na fila.')
          return
        }
        if (!atual.osElegivel) {
          showToast('error', 'Não encontramos uma OS de troca de óleo aberta para a sua moto.')
          return
        }
        if (!pontoValido(atual.base)) {
          showToast('error', 'A base do seu contrato ainda não tem localização cadastrada. Procure o atendimento da base.')
          return
        }

        const permissao = await verificarPermissaoLocalizacao()
        if (permissao === 'denied') {
          showToast(
            'error',
            'Você bloqueou o acesso à localização deste site. Toque no ícone de cadeado/localização ao lado do endereço no navegador, permita manualmente e tente de novo.'
          )
          return
        }
        if (permissao !== 'granted') {
          showToast('info', 'Precisamos da sua localização — clique em "Permitir" na janela que vai abrir.')
        }

        let posicao: GeolocationPosition
        try {
          posicao = await obterPosicaoAtual()
        } catch (err) {
          console.warn('[FILA ÓLEO] localização negada ou indisponível', err)
          showToast(
            'error',
            'Para entrar na fila você deve permitir sua localização. Se já negou antes, ative a permissão de localização deste site nas configurações do navegador e tente novamente.'
          )
          return
        }

        const base = atual.base
        const distancia = distanciaEmMetros(
          { lat: posicao.coords.latitude, long: posicao.coords.longitude },
          base
        )
        setDistancia(distancia)
        void registrarLocalizacao(contratoId, posicao, 'da fila de óleo')
        if (distancia > base.raioMetros) {
          showToast(
            'error',
            `Você precisa estar na base ${base.nome} para entrar na fila. Você está a ${formatarMetros(distancia)} dela.`
          )
          return
        }

        await entrarNaFila({
          contratoId,
          osId: atual.osElegivel.id,
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          distanciaMetros: Math.round(distancia),
        })

        // Relê para a posição vir da mesma regra que alimenta a tela
        const depois = await buscarStatusFila(contratoId)
        setStatus(depois)
        showToast('success', 'Você entrou na fila de troca de óleo!')
      } catch (err: any) {
        console.error('[FILA ÓLEO] erro ao entrar', err)
        showToast('error', err.message ?? 'Erro ao entrar na fila. Tente novamente.')
      } finally {
        entrandoRef.current = false
        setEntrando(false)
      }
    })()
  }, [contratoId])

  return { status, carregando, erro, entrando, distancia, entrar }
}
