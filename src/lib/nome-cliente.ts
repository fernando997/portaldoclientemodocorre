// Clientes PJ chegam do Bubble com a raiz do CNPJ colada no nome
// ("67.305.042 GIOVANE MUNIZ DIAS CORA"). Na tela isso rouba o espaço do nome,
// então o prefixo sai da exibição e o documento aparece separado.
const PREFIXO_CNPJ = /^\d{2}\.\d{3}\.\d{3}\s+/

export function nomeExibicao(nomeCompleto: string): string {
  const limpo = (nomeCompleto ?? '').replace(PREFIXO_CNPJ, '').trim()
  return limpo || (nomeCompleto ?? '')
}

// O Bubble guarda o CNPJ no mesmo campo `cpf`; distingue pelo tamanho.
export function ehCnpj(documento: string): boolean {
  return (documento ?? '').replace(/\D/g, '').length === 14
}

export function formatarDocumento(documento: string): string {
  const digitos = (documento ?? '').replace(/\D/g, '')
  if (digitos.length === 14) {
    return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  if (digitos.length === 11) {
    return digitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }
  return documento ?? ''
}

export function rotuloDocumento(documento: string): string {
  return ehCnpj(documento) ? 'CNPJ' : 'CPF'
}
