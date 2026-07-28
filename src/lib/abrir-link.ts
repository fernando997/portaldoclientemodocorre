// Substitui o WebViewModal do app nativo: links de pagamento/comprovante
// abrem em nova aba (gateways de pagamento tipicamente bloqueiam iframe).
export function abrirLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function abrirPopup(url: string) {
  const largura = 480
  const altura = 720
  const left = window.screenX + (window.outerWidth - largura) / 2
  const top = window.screenY + (window.outerHeight - altura) / 2
  window.open(
    url,
    'documento',
    `width=${largura},height=${altura},left=${left},top=${top},noopener,noreferrer`
  )
}
