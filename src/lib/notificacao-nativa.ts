// Notificação nativa do sistema, usada pelo sino do SAC e pela fila de óleo.
//
// Android exige que a notificação saia do service worker (public/sw.js);
// `new Notification()` direto da página só funciona no desktop. iPhone só
// aceita com o portal instalado na Tela de Início (modo app).
export async function mostrarNotificacaoNativa(titulo: string, corpo: string, tag: string) {
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
