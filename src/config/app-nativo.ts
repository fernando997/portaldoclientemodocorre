// Links das lojas do aplicativo Modo Corre. Ficam no código e não em variável de
// ambiente porque são endereços públicos e fixos: assim o deploy não depende de
// configurar nada fora do repositório para o botão funcionar.
// Interruptor do aviso. Em false o aviso some inteiro da tela, sem remover nada
// do codigo -- util enquanto uma versao nova espera aprovacao nas lojas.
export const AVISO_APP_ATIVO = true

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
