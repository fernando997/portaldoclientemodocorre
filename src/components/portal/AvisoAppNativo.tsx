import { useState } from 'react'
import { Smartphone, X } from 'lucide-react'
import { detectarPlataforma } from '@/lib/dispositivo'
import { AVISO_APP_ATIVO, LOJA_ANDROID, LOJA_IOS, type LojaApp } from '@/config/app-nativo'
import { abrirLink } from '@/lib/abrir-link'
import { LogoGooglePlay, LogoAppStore } from '@/components/portal/icones-lojas'

// Marca que o cliente já viu o modal nesta sessão. Em sessionStorage e não em
// localStorage de propósito: o aviso precisa voltar a cada visita até a migração
// acontecer, mas sem reaparecer a cada troca de aba dentro da mesma visita.
const CHAVE_SESSAO = 'modocorre:aviso-app-visto'

function jaViuNestaSessao() {
  try {
    return sessionStorage.getItem(CHAVE_SESSAO) === '1'
  } catch {
    // Modo privado / cookies bloqueados: mostra o modal, que é o lado seguro
    return false
  }
}

function marcarComoVisto() {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, '1')
  } catch {
    // Sem armazenamento o modal reaparece; não vale quebrar a tela por isso
  }
}

interface Props {
  // Enquanto outro modal urgente estiver na tela (parcela em atraso), o aviso
  // do app espera a vez em vez de empilhar duas camadas sobre o cliente
  suspenso?: boolean
}

function lojasDoAparelho(): LojaApp[] {
  const plataforma = detectarPlataforma()
  if (plataforma === 'android') return [LOJA_ANDROID]
  if (plataforma === 'ios') return [LOJA_IOS]
  // No computador não há como saber qual aparelho ele usa: mostra as duas
  return [LOJA_ANDROID, LOJA_IOS]
}

function BotaoLoja({ loja }: { loja: LojaApp }) {
  const Logo = loja.id === 'android' ? LogoGooglePlay : LogoAppStore

  // Formato de selo de loja: logo à esquerda, chamada pequena em cima e o nome
  // da loja embaixo. É o desenho que o cliente já conhece das duas lojas.
  const conteudo = (
    <>
      <Logo className="shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium">Baixar na</span>
        <span className="text-[15px] font-bold">{loja.nome}</span>
      </span>
    </>
  )

  return (
    <button
      onClick={() => abrirLink(loja.url)}
      className="flex items-center justify-center gap-2.5 rounded-xl bg-dark py-2.5 text-white"
    >
      {conteudo}
    </button>
  )
}

export function AvisoAppNativo({ suspenso = false }: Props) {
  const [modalAberto, setModalAberto] = useState(() => !jaViuNestaSessao())
  const lojas = lojasDoAparelho()

  // Depois dos hooks, para nao mudar a quantidade deles entre renders
  if (!AVISO_APP_ATIVO) return null

  function fecharModal() {
    marcarComoVisto()
    setModalAberto(false)
  }

  return (
    <>
      {/* Faixa fixa: não é dispensável, porque o aviso vale até a migração */}
      <button
        onClick={() => setModalAberto(true)}
        className="flex w-full items-center gap-3 bg-accent px-4 py-3 text-left"
      >
        <Smartphone size={20} className="shrink-0 text-white" />
        <span className="flex-1 text-[13px] font-bold leading-5 text-white">
Baixe o aplicativo Modo Corre. O atendimento vai passar para o app.
        </span>
        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-accent-dark">
          Baixar
        </span>
      </button>

      {modalAberto && !suspenso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60" onClick={fecharModal} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6">
            <button
              onClick={fecharModal}
              aria-label="Fechar"
              className="absolute right-3 top-3 rounded-lg bg-zinc-100 p-2 text-zinc-500"
            >
              <X size={14} />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light">
              <Smartphone size={26} className="text-accent" />
            </div>

            <p className="text-center text-[17px] font-bold text-text-body">
              Baixe o aplicativo Modo Corre
            </p>

            <p className="mt-2 text-center text-[13px] leading-5 text-text-muted">
O Portal do Cliente vai dar lugar ao aplicativo Modo Corre. Baixe agora para continuar acompanhando seu contrato, suas parcelas e a fila de troca de óleo.
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              {lojas.map((loja) => (
                <BotaoLoja key={loja.id} loja={loja} />
              ))}
            </div>

            <button
              onClick={fecharModal}
              className="mt-3 w-full py-2 text-[13px] font-semibold text-text-muted"
            >
              Continuar no portal
            </button>
          </div>
        </div>
      )}
    </>
  )
}
