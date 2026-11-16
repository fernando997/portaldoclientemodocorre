import { detectarPlataforma } from '@/lib/dispositivo'
import { LOJA_ANDROID, LOJA_IOS, type LojaApp } from '@/config/app-nativo'
import { abrirLink } from '@/lib/abrir-link'
import { LogoGooglePlay, LogoAppStore } from '@/components/portal/icones-lojas'

// A regra de qual loja mostrar e o desenho do botão moram aqui porque dois
// lugares precisam deles: o aviso dentro do portal e a página de download que
// substituiu o login. Duplicar significaria um deles envelhecer sozinho.

function lojasDoAparelho(): LojaApp[] {
  const plataforma = detectarPlataforma()
  if (plataforma === 'android') return [LOJA_ANDROID]
  if (plataforma === 'ios') return [LOJA_IOS]
  // No computador não há como saber qual aparelho ele usa: mostra as duas
  return [LOJA_ANDROID, LOJA_IOS]
}

// Formato de selo de loja: logo à esquerda, chamada pequena em cima e o nome
// da loja embaixo. É o desenho que o cliente já conhece das duas lojas.
function BotaoLoja({ loja }: { loja: LojaApp }) {
  const Logo = loja.id === 'android' ? LogoGooglePlay : LogoAppStore

  return (
    <button
      onClick={() => abrirLink(loja.url)}
      className="flex items-center justify-center gap-2.5 rounded-xl bg-dark py-2.5 text-white"
    >
      <Logo className="shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium">Baixar na</span>
        <span className="text-[15px] font-bold">{loja.nome}</span>
      </span>
    </button>
  )
}

// Os botões das lojas do aparelho, empilhados — o conjunto que as duas telas usam.
export function BotoesLojas({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {lojasDoAparelho().map((loja) => (
        <BotaoLoja key={loja.id} loja={loja} />
      ))}
    </div>
  )
}
