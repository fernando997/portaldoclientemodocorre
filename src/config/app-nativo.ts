// Interruptor do portal web. Em false o endereco serve apenas a pagina de
// download dos aplicativos: sem login, sem portal, sem rota de escape. Virou
// false em 16/11/2026, no dia seguinte ao fim do prazo de migracao. O codigo do
// portal continua no repositorio para que religar seja so trocar este valor.
export const PORTAL_WEB_ATIVO = false

// Interruptor do aviso. Em false o aviso some inteiro da tela, sem remover nada
// do codigo -- util enquanto uma versao nova espera aprovacao nas lojas.
// So tem efeito com PORTAL_WEB_ATIVO em true, porque o aviso vive dentro do portal.
export const AVISO_APP_ATIVO = true

// Prazo para o cliente migrar para o aplicativo: 7 dias começando em 09/11/2026,
// o que faz de 15/11 o último dia. A data é o último dia válido, não o dia do
// corte, porque é assim que o cliente conta ("tenho até dia 15").
export const PRAZO_ULTIMO_DIA = '2026-11-15'
export const PRAZO_TOTAL_DIAS = 7

// Links das lojas do aplicativo Modo Corre. Ficam no código e não em variável de
// ambiente porque são endereços públicos e fixos: assim o deploy não depende de
// configurar nada fora do repositório para o botão funcionar.
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
