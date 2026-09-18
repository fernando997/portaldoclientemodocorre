import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, BellRing, Smartphone } from 'lucide-react'
import type { Notificacao } from '@/types/cliente'
import { buscarNotificacoes } from '@/lib/buscar-notificacoes'

const INTERVALO_MS = 3 * 60 * 1000
const CHAVE_VISTAS = '@notificacoes_vistas'
const MAX_EXIBIDAS = 20

// Enquanto não existe workflow para marcar como lida no Bubble, o "visto"
// fica no aparelho: abrir o painel zera o badge das notificações atuais.
function carregarVistas(): Set<string> {
  try {
    const raw = localStorage.getItem(CHAVE_VISTAS)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function salvarVistas(vistas: Set<string>) {
  try {
    localStorage.setItem(CHAVE_VISTAS, JSON.stringify([...vistas].slice(-200)))
  } catch {
    // localStorage indisponível (modo privado etc.): só perde o badge
  }
}

function formatarDataHora(ts: number) {
  if (!ts) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

// --- Notificação nativa -----------------------------------------------------
// Android exige que a notificação saia do service worker (public/sw.js);
// `new Notification()` direto da página só funciona no desktop. iPhone só
// aceita com o portal instalado na Tela de Início (modo app).

type EstadoPermissao = 'sem-suporte' | 'ios-instalar' | 'pedir' | 'ativada' | 'bloqueada'

function ehIphone() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function estaInstaladoComoApp() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function lerEstadoPermissao(): EstadoPermissao {
  if (ehIphone() && !estaInstaladoComoApp()) return 'ios-instalar'
  if (typeof Notification === 'undefined') return 'sem-suporte'
  if (Notification.permission === 'granted') return 'ativada'
  if (Notification.permission === 'denied') return 'bloqueada'
  return 'pedir'
}

async function mostrarNotificacaoNativa(titulo: string, corpo: string, tag: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const opcoes = { body: corpo, icon: '/favicon.png', badge: '/favicon.png', tag }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(titulo, opcoes)
      return
    }
  } catch {
    // cai no fallback abaixo
  }
  try {
    new Notification(titulo, opcoes)
  } catch {
    // navegador sem suporte a Notification() da página: ignora
  }
}

function notificarNativo(n: Notificacao) {
  mostrarNotificacaoNativa(
    n.titulo || 'Nova notificação',
    [n.setor, n.mensagem].filter(Boolean).join(' · '),
    n.id
  )
}

// ---------------------------------------------------------------------------

interface Props {
  contratoId: string
}

export function NotificacoesSino({ contratoId }: Props) {
  const [itens, setItens] = useState<Notificacao[]>([])
  const [aberto, setAberto] = useState(false)
  const [vistas, setVistas] = useState<Set<string>>(() => carregarVistas())
  const [permissao, setPermissao] = useState<EstadoPermissao>(() => lerEstadoPermissao())
  const [topo, setTopo] = useState(0)
  const conhecidasRef = useRef<Set<string> | null>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let ativo = true
    conhecidasRef.current = null

    async function atualizar() {
      try {
        const lista = await buscarNotificacoes(contratoId)
        if (!ativo) return
        setItens(lista)

        // Na primeira carga só registra o que já existe; nas seguintes,
        // dispara notificação nativa para o que for realmente novo.
        const conhecidas = conhecidasRef.current
        if (conhecidas) {
          lista.filter((n) => !conhecidas.has(n.id) && !n.lida).forEach(notificarNativo)
        }
        conhecidasRef.current = new Set(lista.map((n) => n.id))
      } catch (err) {
        console.error('[NOTIFICACOES] erro ao buscar', err)
      }
    }

    atualizar()
    const timer = setInterval(atualizar, INTERVALO_MS)
    return () => {
      ativo = false
      clearInterval(timer)
    }
  }, [contratoId])

  useEffect(() => {
    if (!aberto) return
    function onClickOutside(e: MouseEvent) {
      if (painelRef.current && !painelRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [aberto])

  const naoLidas = itens.filter((n) => !n.lida && !vistas.has(n.id))

  function abrir() {
    const proximo = !aberto
    setAberto(proximo)
    if (!proximo) return

    // Painel fixo na largura da tela, logo abaixo do sino: ancorado no botão
    // ele estourava pela esquerda no celular
    setTopo((botaoRef.current?.getBoundingClientRect().bottom ?? 0) + 8)
    setPermissao(lerEstadoPermissao())

    // Abrir o painel conta como "visto" para o badge
    if (naoLidas.length > 0) {
      const novas = new Set(vistas)
      naoLidas.forEach((n) => novas.add(n.id))
      setVistas(novas)
      salvarVistas(novas)
    }
  }

  async function ativarNotificacoes() {
    if (typeof Notification === 'undefined') return
    try {
      const resultado = await Notification.requestPermission()
      setPermissao(lerEstadoPermissao())
      if (resultado === 'granted') {
        // Dispara uma de teste para o cliente ver que funcionou
        mostrarNotificacaoNativa('Notificações ativadas', 'Você vai receber os avisos do portal aqui.', 'teste')
      }
    } catch {
      setPermissao(lerEstadoPermissao())
    }
  }

  const exibidas = itens.slice(0, MAX_EXIBIDAS)

  return (
    <div className="relative" ref={painelRef}>
      <button
        ref={botaoRef}
        onClick={abrir}
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/12"
      >
        <Bell size={18} className="text-white" />
        {naoLidas.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {naoLidas.length > 99 ? '99+' : naoLidas.length}
          </span>
        )}
      </button>

      {aberto && (
        <div
          style={{ top: topo }}
          className="fixed left-4 right-4 z-30 overflow-hidden rounded-2xl bg-white shadow-2xl sm:left-auto sm:right-5 sm:w-[340px]"
        >
          <div className="border-b border-surface px-4 py-3">
            <p className="text-sm font-bold text-text-body">Notificações</p>
          </div>

          {/* Ativação da notificação nativa do aparelho */}
          {permissao === 'pedir' && (
            <button
              onClick={ativarNotificacoes}
              className="flex w-full items-center gap-2.5 border-b border-surface bg-accent-light px-4 py-3 text-left"
            >
              <BellRing size={16} className="shrink-0 text-accent" />
              <span className="text-[13px] font-semibold text-accent">Ativar notificações no celular</span>
            </button>
          )}
          {permissao === 'ativada' && (
            <div className="flex items-center gap-2.5 border-b border-surface px-4 py-2.5">
              <BellRing size={14} className="shrink-0 text-accent" />
              <span className="text-xs text-text-muted">Notificações ativadas neste aparelho</span>
            </div>
          )}
          {permissao === 'bloqueada' && (
            <div className="flex items-center gap-2.5 border-b border-surface px-4 py-2.5">
              <BellOff size={14} className="shrink-0 text-text-muted" />
              <span className="text-xs text-text-muted">
                Notificações bloqueadas. Libere nas configurações do navegador para este site.
              </span>
            </div>
          )}
          {permissao === 'ios-instalar' && (
            <div className="flex items-start gap-2.5 border-b border-surface bg-accent-light px-4 py-3">
              <Smartphone size={16} className="mt-0.5 shrink-0 text-accent" />
              <span className="text-xs leading-snug text-text-body">
                No iPhone, para receber notificações, toque em <b>Compartilhar</b> e depois em{' '}
                <b>Adicionar à Tela de Início</b>. Abra o portal por esse ícone e ative aqui.
              </span>
            </div>
          )}

          {exibidas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <BellOff size={26} className="text-border" />
              <p className="text-sm text-text-muted">Nenhuma notificação.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {exibidas.map((n) => {
                const naoLida = !n.lida && !vistas.has(n.id)
                const meta = [n.setor, n.tipo, n.ref].filter(Boolean).join(' · ')
                return (
                  <div key={n.id} className="flex gap-2.5 border-b border-surface px-4 py-3 last:border-0">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${naoLida ? 'bg-accent' : 'bg-transparent'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] leading-snug text-text-body ${naoLida ? 'font-bold' : 'font-medium'}`}>
                        {n.titulo || '—'}
                      </p>
                      {n.mensagem && <p className="mt-0.5 text-xs leading-snug text-text-muted">{n.mensagem}</p>}
                      <p className="mt-1 text-[11px] text-text-muted">
                        {[meta, formatarDataHora(n.criada_em_ts)].filter(Boolean).join(' — ')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
