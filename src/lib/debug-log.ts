// debug-log.ts — Analisa e exibe todos os caminhos de uma resposta do Bubble

const ATIVO = false // mude para true para depurar o mapeamento do Bubble

export function logBubble(tag: string, data: unknown) {
  if (!ATIVO) return
  const linha = '─'.repeat(60)
  console.log(`\n${linha}`)
  console.log(`  BUBBLE DEBUG › ${tag}`)
  console.log(linha)
  try {
    console.log(JSON.stringify(data, null, 2))
  } catch {
    console.log(String(data))
  }
  console.log(`${linha}\n`)
}

export function logCaminhos(obj: unknown, raiz = 'response') {
  if (!ATIVO) return
  const linha = '─'.repeat(60)
  console.log(`\n${linha}`)
  console.log(`  BUBBLE CAMINHOS › ${raiz}`)
  console.log(linha)
  _percorrer(obj, raiz, 0)
  console.log(`${linha}\n`)
}

function _percorrer(obj: unknown, caminho: string, profundidade: number) {
  if (profundidade > 5) {
    console.log(`  ${caminho}: [profundidade máxima]`)
    return
  }

  if (obj === null || obj === undefined) {
    console.log(`  ${caminho}: null`)
    return
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      console.log(`  ${caminho}: [] ← lista vazia`)
    } else {
      console.log(`  ${caminho}: [lista • ${obj.length} item(s)]`)
      _percorrer(obj[0], `${caminho}[0]`, profundidade + 1)
    }
    return
  }

  if (typeof obj === 'object') {
    const chaves = Object.keys(obj as object)
    if (chaves.length === 0) {
      console.log(`  ${caminho}: {} ← objeto vazio`)
      return
    }
    for (const chave of chaves) {
      const valor = (obj as any)[chave]
      const sub = `${caminho}.${chave}`
      if (typeof valor === 'object' && valor !== null) {
        _percorrer(valor, sub, profundidade + 1)
      } else {
        const tipo = typeof valor
        let exibir: string
        if (typeof valor === 'string' && valor.length > 60) {
          exibir = `"${valor.slice(0, 60)}..."  (string, ${valor.length} chars)`
        } else {
          exibir = `${JSON.stringify(valor)}  (${tipo})`
        }
        console.log(`  ${sub}: ${exibir}`)
      }
    }
    return
  }

  const tipo = typeof obj
  console.log(`  ${caminho}: ${JSON.stringify(obj)}  (${tipo})`)
}
