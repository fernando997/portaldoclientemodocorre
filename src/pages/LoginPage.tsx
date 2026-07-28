import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneStep } from '@/components/login/PhoneStep'
import { CodeStep } from '@/components/login/CodeStep'
import { useAuthStore } from '@/store/auth'
import { BUBBLE_BASE_URL, BUBBLE_API_KEY } from '@/config/api'
import { mapearCliente } from '@/lib/mapear-cliente'
import type { BubbleResposta } from '@/data/bubble-estrutura'
import { capturarLocalizacaoAtual } from '@/services/localizacao'
import { registrarSessaoLogin } from '@/services/sessao'
import { showToast } from '@/components/Toast'
import logo from '@/assets/logo.png'
import motoboy from '@/assets/motoboy.png'

const MANTER_LOGADO_KEY = '@manter_logado'

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function tentarEnvio(telefone: string, codigo: string): Promise<boolean> {
  const url = `${BUBBLE_BASE_URL}/chamar-contrato`
  const body = { telefone, apikey: BUBBLE_API_KEY, codigo }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      return false
    }
    return res.ok && data.status === 'success'
  } catch (err) {
    console.error('[LOGIN] ERRO DE REDE', err)
    return false
  }
}

async function tentarVerificar(telefone: string, codigo: string): Promise<BubbleResposta | null> {
  const url = `${BUBBLE_BASE_URL}/portal-cliente_recebe-codigo`
  const body = { telefone, apikey: BUBBLE_API_KEY, codigo }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let data: BubbleResposta
    try {
      data = JSON.parse(text)
    } catch {
      return null
    }
    if (res.ok && data.status === 'success' && data.response?.cliente?._id) return data
    return null
  } catch (err) {
    console.error('[VERIFICAR] ERRO DE REDE', err)
    return null
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const setCliente = useAuthStore((s) => s.setCliente)
  const cliente = useAuthStore((s) => s.cliente)
  const [loading, setLoading] = useState(false)
  const [etapa, setEtapa] = useState<'celular' | 'codigo'>('celular')
  const [celular, setCelular] = useState('')
  const [manterLogado, setManterLogado] = useState(false)
  const enviando = useRef(false)

  useEffect(() => {
    if (localStorage.getItem(MANTER_LOGADO_KEY) === '1') {
      setManterLogado(true)
      if (cliente) navigate('/portal', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleEnviarCodigo(cel: string) {
    if (enviando.current) return
    enviando.current = true
    setLoading(true)

    const codigo = gerarCodigo()
    const celSoDigitos = cel.replace(/\D/g, '')

    try {
      const [r1, r2] = await Promise.all([tentarEnvio(cel, codigo), tentarEnvio(celSoDigitos, codigo)])

      if (!r1 && !r2) {
        showToast('error', 'Número não cadastrado.')
        return
      }

      setCelular(cel)
      setEtapa('codigo')
      showToast('success', 'Código enviado! Verifique seu WhatsApp.')
    } catch (err) {
      console.error('[LOGIN] Erro', err)
      showToast('error', 'Erro ao conectar. Tente novamente.')
    } finally {
      enviando.current = false
      setLoading(false)
    }
  }

  async function handleVerificarCodigo(codigo: string) {
    if (enviando.current) return
    enviando.current = true
    setLoading(true)

    const celSoDigitos = celular.replace(/\D/g, '')

    try {
      const [d1, d2] = await Promise.all([
        tentarVerificar(celular, codigo),
        tentarVerificar(celSoDigitos, codigo),
      ])

      const data = d1 ?? d2

      if (!data) {
        showToast('error', 'Código inválido ou expirado.')
        return
      }

      const clienteMapeado = mapearCliente(data.response)
      setCliente(clienteMapeado)

      const contrato = clienteMapeado.contratos[0]
      const contratoId = contrato?.id ?? ''

      registrarSessaoLogin({
        nome: clienteMapeado.nome_completo,
        numeroContrato: contrato?.numero,
        contratoId,
      })
      capturarLocalizacaoAtual(contratoId)

      if (manterLogado) {
        localStorage.setItem(MANTER_LOGADO_KEY, '1')
      } else {
        localStorage.removeItem(MANTER_LOGADO_KEY)
      }

      showToast('success', 'Acesso liberado! Entrando...')
      setTimeout(() => navigate('/portal', { replace: true }), 1000)
    } catch (err) {
      console.error('[VERIFICAR] Erro', err)
      showToast('error', 'Erro ao conectar. Tente novamente.')
    } finally {
      enviando.current = false
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-svh items-center justify-center bg-cover bg-center px-6 py-10"
      style={{ backgroundImage: `url(${motoboy})` }}
    >
      <div className="absolute inset-0 bg-[rgba(6,28,28,0.72)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-4 flex flex-col items-center rounded-3xl border border-white/20 bg-white/10 px-5 py-7 backdrop-blur-sm">
          <img src={logo} alt="Portal do Cliente" className="mb-3 h-36 w-full object-contain" />
          <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-light">Portal do Cliente</h1>
          <p className="text-center text-[13px] leading-5 text-text-faint">
            {etapa === 'celular'
              ? 'Acesso exclusivo para clientes cadastrados'
              : 'Verifique seu WhatsApp e insira o código'}
          </p>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-6 backdrop-blur-sm">
          {etapa === 'celular' ? (
            <>
              <PhoneStep onSubmit={handleEnviarCodigo} loading={loading} />
              <button
                type="button"
                onClick={() => setManterLogado((v) => !v)}
                className="mt-4 flex items-center gap-2.5 border-t border-white/10 pt-4"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    manterLogado ? 'border-accent bg-accent' : 'border-white/45'
                  }`}
                >
                  {manterLogado && (
                    <svg viewBox="0 0 20 20" fill="white" className="h-3.5 w-3.5">
                      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L9 11.6l6.3-6.3a1 1 0 0 1 1.4 0Z" />
                    </svg>
                  )}
                </span>
                <span className="text-sm font-medium text-white/65">Manter sempre logado</span>
              </button>
            </>
          ) : (
            <CodeStep
              celular={celular}
              onSubmit={handleVerificarCodigo}
              onVoltar={() => setEtapa('celular')}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
