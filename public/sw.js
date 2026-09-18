// Service worker mínimo, SEM cache de nada: existe só porque o Android exige
// um service worker para exibir notificações nativas, e serve de base para o
// push com o app fechado (fase 2). Não intercepta requisições.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Toque na notificação: traz o portal para frente (ou abre, se fechado)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((j) => 'focus' in j)
      return aberta ? aberta.focus() : self.clients.openWindow('/portal')
    })
  )
})
