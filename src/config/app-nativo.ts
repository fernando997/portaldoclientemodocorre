// Links das lojas do aplicativo Modo Corre. Ficam no código e não em variável de
// ambiente porque são endereços públicos e fixos: assim o deploy não depende de
// configurar nada fora do repositório para o botão funcionar.
// Desligado em 03/11/2026 enquanto as versoes novas esperam aprovacao nas lojas.
// Volte para true e o aviso reaparece inteiro -- nada mais precisa mudar.
export const AVISO_APP_ATIVO = false

export interface LojaApp {
  id: 'android' | 'ios'
  nome: string
  url: string
}

export const LOJA_ANDROID: LojaApp = {
  id: 'android',
  nome: 'Play Store',
  url: 'https://play.google.com/store/apps/details?id=com.modocorre.portalclientemobile',
}

export const LOJA_IOS: LojaApp = {
  id: 'ios',
  nome: 'App Store',
  url: 'https://apps.apple.com/br/app/id6803237018',
}
