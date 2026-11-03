// Logos das lojas em SVG inline. Fogem do lucide-react que o resto do projeto usa
// porque marca registrada não tem equivalente genérico: o cliente reconhece a loja
// pelo desenho, não pelo nome.

interface Props {
  size?: number
  className?: string
}

export function LogoGooglePlay({ size = 23, className }: Props) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Google Play"
    >
      {/* O triângulo oficial são quatro faces; o original usa degradê, mas neste
          tamanho a cor chapada é indistinguível e dispensa ids únicos de gradiente */}
      <path
        fill="#00A0FF"
        d="M47.6 18.9C42.4 24.4 39.4 32.9 39.4 44v424c0 11.1 3 19.6 8.2 25.1l1.4 1.4 237.4-237.4v-2.8L49 17l-1.4 1.9z"
      />
      <path
        fill="#FFBC00"
        d="M365.5 336.3l-79.1-79.2v-2.8l79.2-79.2 1.8 1 93.8 53.3c26.8 15.2 26.8 40.1 0 55.4l-93.8 53.3-1.9-1.8z"
      />
      <path fill="#FF3A44" d="M367.4 338.1l-81-81-238.8 238.8c8.8 9.3 23.3 10.5 39.7 1.2l280.1-159z" />
      <path fill="#00D26B" d="M367.4 176.1L87.3 17.1C70.9 7.8 56.4 9 47.6 18.3l238.8 238.8 81-81z" />
    </svg>
  )
}

export function LogoAppStore({ size = 20, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      // currentColor: a maçã acompanha a cor do texto, então serve tanto no botão
      // claro de "em breve" quanto no botão escuro de download
      fill="currentColor"
      className={className}
      role="img"
      aria-label="App Store"
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}
