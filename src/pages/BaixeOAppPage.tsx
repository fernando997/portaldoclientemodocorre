import { useEffect } from 'react'
import { BotoesLojas } from '@/components/lojas/BotoesLojas'
import logo from '@/assets/logo.png'
import motoboy from '@/assets/motoboy.png'

// O portal guardava a ficha do cliente no localStorage do aparelho: nome, CPF,
// validade de CNH, endereço e parcelas. Sem portal não há mais o "Sair da conta"
// que limpava isso, então esses dados ficariam no celular para sempre, sem
// servir para nada. A primeira visita a esta página apaga o que sobrou.
const RESTOS_DO_PORTAL = ['portal-auth', '@manter_logado', '@login_bloqueio']

function limparDadosDoPortal() {
  for (const chave of RESTOS_DO_PORTAL) {
    try {
      localStorage.removeItem(chave)
    } catch {
      // Modo privado ou armazenamento bloqueado: não há o que limpar
    }
  }
}

// Tela única que substituiu o portal web depois que o atendimento passou para
// os aplicativos nativos. Não há login: quem abre o endereço já cai aqui.
// Mantém o fundo e o cartão de vidro da antiga tela de login para o cliente
// reconhecer que chegou no lugar certo, e não numa página quebrada.
export function BaixeOAppPage() {
  useEffect(limparDadosDoPortal, [])

  return (
    <div
      className="relative flex min-h-svh items-center justify-center bg-cover bg-center px-6 py-10"
      style={{ backgroundImage: `url(${motoboy})` }}
    >
      <div className="absolute inset-0 bg-[rgba(6,28,28,0.72)]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 px-5 py-8 backdrop-blur-sm">
        <img src={logo} alt="Modo Corre" className="mb-5 h-36 w-full object-contain" />

        <h1 className="mb-6 text-center text-xl font-bold leading-7 tracking-tight text-text-light">
          Baixe agora o app do Cliente Modo Corre
        </h1>

        <BotoesLojas />
      </div>
    </div>
  )
}
