import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/api'

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

// Checa o estado atual da permissão de geolocalização sem disparar o popup
// nativo, pra diferenciar "nunca perguntou" de "usuário bloqueou de vez" —
// nesse segundo caso o navegador nunca mais reabre o popup sozinho.
export async function verificarPermissaoLocalizacao(): Promise<PermissionState | 'indisponivel'> {
  if (!('permissions' in navigator)) return 'indisponivel'
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'indisponivel'
  }
}

// Versão em Promise da captura de localização, usada quando a ação do
// usuário precisa ficar bloqueada até haver permissão concedida (ex:
// solicitação de desbloqueio).
export function obterPosicaoAtual(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocalização não suportada neste navegador.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
    })
  })
}

// Captura pontual de localização (foreground, uma vez, no login) — sem
// rastreamento em background, que permanece exclusivo do app nativo.
export function capturarLocalizacaoAtual(contratoId: string): void {
  if (!('geolocation' in navigator)) return

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const ok = await supabaseInsert('localizacoes', {
        contrato_id: contratoId,
        device_id: obterDeviceId(),
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        precisao: pos.coords.accuracy,
        capturado_em: new Date(pos.timestamp).toISOString(),
      })
      console.log('[LOC] Snapshot de login', ok ? 'salvo' : 'FALHOU')
    },
    (err) => console.warn('[LOC] Permissão negada ou erro', err),
    { enableHighAccuracy: true, timeout: 10_000 }
  )
}
