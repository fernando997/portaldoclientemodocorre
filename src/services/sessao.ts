import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/api'

// Identificador anônimo do aparelho, só para contar quantos aparelhos distintos
// acessam. Não tem nada de localização: mora aqui porque o registro de sessão é
// o único lugar que o usa.
const KEY_DEVICE_ID = 'device_id'

export function obterDeviceId(): string {
  let id = localStorage.getItem(KEY_DEVICE_ID)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY_DEVICE_ID, id)
  }
  return id
}

async function supabaseInsert(tabela: string, payload: object): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(`[SUPABASE] ${tabela} erro ${res.status}:`, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error(`[SUPABASE] ${tabela} falha de rede:`, err)
    return false
  }
}

export async function registrarSessaoLogin(params: {
  nome: string
  numeroContrato: string | number | undefined
  contratoId: string
}) {
  const ok = await supabaseInsert('sessoes_login', {
    nome: params.nome,
    numero_contrato: params.numeroContrato ? String(params.numeroContrato) : null,
    contrato_id: params.contratoId,
    device_id: obterDeviceId(),
    marca: null,
    modelo: null,
    sistema_operacional: 'web',
    so_versao: navigator.userAgent,
    push_token: null,
  })
  console.log('[SESSAO] Registro de login', ok ? 'salvo' : 'FALHOU')
}
