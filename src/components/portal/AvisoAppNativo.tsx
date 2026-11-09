import { useState } from 'react'
import { Smartphone, X } from 'lucide-react'
import { detectarPlataforma } from '@/lib/dispositivo'
import {
  AVISO_APP_ATIVO,
  LOJA_ANDROID,
  LOJA_IOS,
  PRAZO_TOTAL_DIAS,
  PRAZO_ULTIMO_DIA,
  type LojaApp,
} from '@/config/app-nativo'
import { diasRestantes, formatarDiaMes } from '@/lib/contagem-regressiva'
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

interface TextosPrazo {
  faixa: string
  contadorTitulo: string
  contadorDetalhe: string
  corpo: string
}

// Os três estados do prazo em um só lugar, para a contagem não virar um emaranhado
// de condições espalhadas pelo JSX. O último dia e o prazo vencido falam de
// "atendimento", e não de portal desligado, porque é o atendimento que muda de
// lugar na data -- o portal continua no ar.
function textosDoPrazo(dias: number, ultimoDia: string): TextosPrazo {
  const data = formatarDiaMes(ultimoDia)

  if (dias === 0) {
    return {
      faixa: 'O atendimento agora é pelo aplicativo Modo Corre.',
      contadorTitulo: 'Prazo encerrado',
      contadorDetalhe: `terminou em ${data}`,
      corpo: 'O atendimento passou para o aplicativo Modo Corre. Baixe para continuar acompanhando seu contrato, suas parcelas e a fila de troca de óleo.',
    }
  }

  if (dias === 1) {
    return {
      faixa: 'Hoje é o último dia para baixar o aplicativo Modo Corre.',
      contadorTitulo: 'Último dia',
      contadorDetalhe: `o prazo termina hoje, ${data}`,
      corpo: 'O Portal do Cliente vai dar lugar ao aplicativo Modo Corre. Baixe hoje para continuar acompanhando seu contrato, suas parcelas e a fila de troca de óleo.',
    }
  }

  return {
    faixa: `Faltam ${dias} dias para o atendimento passar para o aplicativo.`,
    contadorTitulo: 'dias restantes',
    contadorDetalhe: `baixe o aplicativo até ${data}`,
    corpo: `O Portal do Cliente vai dar lugar ao aplicativo Modo Corre. Baixe até ${data} para continuar acompanhando seu contrato, suas parcelas e a fila de troca de óleo.`,
  }
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

  // Recalculado a cada render, sem timer: o número só precisa estar certo quando
  // a tela é desenhada, e o cliente não fica com o portal aberto virando o dia.
  const dias = diasRestantes(PRAZO_ULTIMO_DIA, undefined, PRAZO_TOTAL_DIAS)
  const textos = textosDoPrazo(dias, PRAZO_ULTIMO_DIA)
  // Na reta final o aviso troca o verde pelo vermelho: é o mesmo sinal que o
  // portal já usa para parcela em atraso, então o cliente lê como urgência.
  const urgente = dias <= 2

  function fecharModal() {
    marcarComoVisto()
    setModalAberto(false)
  }

  return (
    <>
      {/* Faixa fixa: não é dispensável, porque o aviso vale até a migração */}
      <button
        onClick={() => setModalAberto(true)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${urgente ? 'bg-danger' : 'bg-accent'}`}
      >
        {dias >= 2 ? (
          <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-white/20 leading-none text-white">
            <span className="text-[15px] font-extrabold tabular-nums">{dias}</span>
            <span className="text-[8px] font-bold uppercase">dias</span>
          </span>
        ) : (
          <Smartphone size={20} className="shrink-0 text-white" />
        )}

        <span className="flex-1 text-[13px] font-bold leading-5 text-white">{textos.faixa}</span>

        <span
          className={`shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold ${urgente ? 'text-danger' : 'text-accent-dark'}`}
        >
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

            <div
              className={`mt-4 flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 ${urgente ? 'bg-danger-bg text-danger' : 'bg-accent-light text-accent-dark'}`}
            >
              {dias >= 2 && (
                <span className="text-[30px] font-extrabold leading-none tabular-nums">{dias}</span>
              )}
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[13px] font-bold">{textos.contadorTitulo}</span>
                <span className="text-[11px] opacity-80">{textos.contadorDetalhe}</span>
              </span>
            </div>

            <p className="mt-3 text-center text-[13px] leading-5 text-text-muted">{textos.corpo}</p>

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
