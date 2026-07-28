// Substitui o WebViewModal do app nativo: links de pagamento/comprovante
// abrem em nova aba (gateways de pagamento tipicamente bloqueiam iframe).
export function abrirLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
