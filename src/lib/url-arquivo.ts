// Links de arquivo do Bubble chegam em dois formatos, dependendo de como o
// campo foi gravado: protocol-relative ("//f35e...cdn.bubble.io/...", o padrão
// da Data API) ou já absoluto ("https://f35e...cdn.bubble.io/...").
//
// Prefixar "https:" às cegas quebra o segundo caso: vira "https:https://...",
// que o Chrome interpreta como host "https" e devolve
// DNS_PROBE_FINISHED_NXDOMAIN. Foi exatamente o que impediu parte dos clientes
// de abrir o Documento CRLV — os CRLVs enviados recentemente estão gravados com
// o "https://" na frente.
// Busca vazia no Bubble devolve `{}` em vez de ausente, então só texto passa.
export function urlArquivo(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const bruto = valor.trim()
  if (!bruto) return null
  if (bruto.startsWith('https://') || bruto.startsWith('http://')) return bruto
  if (bruto.startsWith('//')) return `https:${bruto}`
  return `https://${bruto}`
}
