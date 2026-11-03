// Detecta o sistema do aparelho para oferecer a loja certa.
// Fica aqui como módulo puro: o único jeito de errar isso é no user agent,
// e assim a regra pode ser lida e testada sem subir a tela.
export type Plataforma = 'android' | 'ios' | 'outro'

export function detectarPlataforma(): Plataforma {
  if (typeof navigator === 'undefined') return 'outro'

  const ua = navigator.userAgent || ''

  if (/android/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'

  // iPadOS 13+ se identifica como "Macintosh". O que separa um iPad de um Mac
  // é a tela de toque — sem isto, todo iPad cai no caso 'outro'.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'ios'

  return 'outro'
}
