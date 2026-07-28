import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  CheckCircle2,
  FileText,
  BarChart2,
  ClipboardList,
  User,
  ChevronDown,
  LogOut,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Gavel,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { Cliente } from '@/types/cliente'
import { AlertaAtraso } from '@/components/portal/AlertaAtraso'
import { resolverStatusParcela } from '@/utils/parcela'
import { Dashboard } from '@/components/portal/sections/Dashboard'
import { ProximosPagamentos } from '@/components/portal/sections/ProximosPagamentos'
import { ParcelasPagas } from '@/components/portal/sections/ParcelasPagas'
import { Contratos } from '@/components/portal/sections/Contratos'
import { Multas } from '@/components/portal/sections/Multas'
import { TabelaTarifaria } from '@/components/portal/sections/TabelaTarifaria'
import { Vistorias } from '@/components/portal/sections/Vistorias'
import { MeusDados } from '@/components/portal/sections/MeusDados'
import logo from '@/assets/logo.png'

type Secao =
  | 'dashboard'
  | 'proximos-pagamentos'
  | 'parcelas-pagas'
  | 'contratos'
  | 'multas'
  | 'tabela-tarifaria'
  | 'vistorias'
  | 'meus-dados'

const ABAS: { id: Secao; label: string; Icon: typeof Grid }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: Grid },
  { id: 'parcelas-pagas', label: 'Pagas', Icon: CheckCircle2 },
  { id: 'contratos', label: 'Contratos', Icon: FileText },
  { id: 'multas', label: 'Multas', Icon: Gavel },
  { id: 'tabela-tarifaria', label: 'Tarifas', Icon: BarChart2 },
  { id: 'vistorias', label: 'Vistorias', Icon: ClipboardList },
  { id: 'meus-dados', label: 'Meus dados', Icon: User },
]

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataCurta(iso: string) {
  const [, mes, dia] = iso.split('-')
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]}`
}

export function PortalPage() {
  const navigate = useNavigate()
  const cliente = useAuthStore((s) => s.cliente)
  const logout = useAuthStore((s) => s.logout)
  const [secaoAtiva, setSecaoAtiva] = useState<Secao>('dashboard')
  const [alertaFechado, setAlertaFechado] = useState(false)
  const [dropdownVisivel, setDropdownVisivel] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  useEffect(() => {
    if (!cliente) navigate('/login', { replace: true })
  }, [cliente, navigate])

  // Encerra a sessão por inatividade após 1h, igual ao app nativo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (confirm('Sua sessão expirou por inatividade.\n\nClique em OK para sair.')) handleLogout()
    }, 60 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [handleLogout])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownVisivel(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!cliente) return null

  const emAberto = cliente.parcelas
    .filter((p) => {
      const s = resolverStatusParcela(p.status, p.vencimento)
      return s === 'atrasada' || s === 'a_vencer'
    })
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))

  const proxima = emAberto[0] ?? null
  const temAtrasadas = cliente.parcelas.some((p) => resolverStatusParcela(p.status, p.vencimento) === 'atrasada')

  const diasParaVencer = proxima
    ? Math.ceil(
        (new Date(proxima.vencimento + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const isWarning = diasParaVencer !== null && diasParaVencer <= 2 && !temAtrasadas

  const contrato = cliente.contratos.find((c) => c.status === 'ativo') ?? cliente.contratos[0]

  const iniciais = cliente.nome_completo
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  function labelDias() {
    if (diasParaVencer === 0) return 'Vence hoje!'
    if (diasParaVencer === 1) return 'Vence amanhã!'
    return `Vence em ${diasParaVencer} dias`
  }

  function renderSecao(cliente: Cliente) {
    switch (secaoAtiva) {
      case 'dashboard':
        return <Dashboard cliente={cliente} />
      case 'proximos-pagamentos':
        return <ProximosPagamentos cliente={cliente} />
      case 'parcelas-pagas':
        return <ParcelasPagas cliente={cliente} />
      case 'contratos':
        return <Contratos cliente={cliente} />
      case 'multas':
        return <Multas cliente={cliente} />
      case 'tabela-tarifaria':
        return <TabelaTarifaria cliente={cliente} />
      case 'vistorias':
        return <Vistorias cliente={cliente} />
      case 'meus-dados':
        return <MeusDados cliente={cliente} />
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-dark">
      {temAtrasadas && !alertaFechado && (
        <AlertaAtraso
          parcelas={cliente.parcelas}
          onClose={() => setAlertaFechado(true)}
          onVerPagamentos={() => {
            setSecaoAtiva('proximos-pagamentos')
            setAlertaFechado(true)
          }}
        />
      )}

      {/* Header escuro */}
      <div className="px-5 pb-6">
        <div className="flex min-h-[88px] items-center justify-between pb-5 pt-2">
          <img src={logo} alt="Portal do Cliente" className="h-20 w-[140px] object-contain" />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownVisivel((v) => !v)}
              className="flex max-w-[180px] items-center gap-2 rounded-3xl bg-white/12 px-2.5 py-1.5"
            >
              {cliente.foto_url ? (
                <img src={cliente.foto_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
                  <span className="text-[11px] font-bold text-white">{iniciais}</span>
                </div>
              )}
              <span className="flex-1 truncate text-[13px] font-semibold text-white">
                {cliente.nome_completo.split(' ').slice(0, 2).join(' ')}
              </span>
              <ChevronDown size={11} className="text-white" />
            </button>

            {dropdownVisivel && (
              <div className="absolute right-0 top-full z-20 mt-2 w-62 overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-accent">
                    <span className="text-[15px] font-bold text-white">{iniciais}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold tracking-tight text-text-body">
                      {cliente.nome_completo}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">{cliente.email || cliente.celular}</p>
                  </div>
                </div>
                <div className="h-px bg-surface" />
                <button
                  onClick={() => {
                    setDropdownVisivel(false)
                    if (confirm('Deseja encerrar a sessão?')) handleLogout()
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left"
                >
                  <LogOut size={17} className="text-danger" />
                  <span className="text-sm font-semibold text-danger">Sair da conta</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {contrato && (
            <p className="mb-1.5 text-xs font-medium tracking-wide text-text-faint">
              {contrato.veiculo.placa} · Contrato #{contrato.numero}
            </p>
          )}

          {proxima ? (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                temAtrasadas
                  ? 'border-[1.5px] border-danger bg-danger/10'
                  : isWarning
                    ? 'border-[1.5px] border-amber-500 bg-amber-500/10'
                    : 'border-white/12 bg-white/8'
              }`}
            >
              <div className="flex-1">
                <div className="mb-0.5 flex items-center gap-1.5">
                  {isWarning && <AlertTriangle size={14} className="text-amber-500" />}
                  {temAtrasadas && <AlertCircle size={14} className="text-danger" />}
                  <span
                    className={`text-xs font-medium ${
                      temAtrasadas ? 'text-danger' : isWarning ? 'text-amber-500' : 'text-text-faint'
                    }`}
                  >
                    {isWarning ? labelDias() : temAtrasadas ? 'Em atraso' : 'Próximo vencimento'}
                  </span>
                </div>
                <p className="text-[15px] font-bold text-white">{formatarDataCurta(proxima.vencimento)}</p>
                <button
                  onClick={() => setSecaoAtiva('proximos-pagamentos')}
                  className={`mt-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white ${
                    temAtrasadas ? 'bg-danger' : 'bg-accent'
                  }`}
                >
                  <Calendar size={12} />
                  PRÓXIMAS
                </button>
              </div>
              <p className={`text-xl font-bold tracking-tight ${isWarning ? 'text-amber-500' : 'text-white'}`}>
                {formatarMoeda(proxima.valor)}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/8 p-4">
              <CheckCircle2 size={22} className="text-accent" />
              <span className="flex-1 text-[15px] font-semibold text-white">Parcelas em dia</span>
              <button
                onClick={() => setSecaoAtiva('proximos-pagamentos')}
                className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold tracking-wide text-white"
              >
                <Calendar size={12} />
                PRÓXIMAS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet branco */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-t-[28px] bg-white">
        <div className="flex gap-1 overflow-x-auto px-2 pt-2">
          {ABAS.map((aba) => {
            const ativo = secaoAtiva === aba.id
            return (
              <button
                key={aba.id}
                onClick={() => setSecaoAtiva(aba.id)}
                className={`flex shrink-0 flex-col items-center gap-1 border-b-2 px-3.5 py-2.5 ${
                  ativo ? 'border-accent' : 'border-transparent'
                }`}
              >
                <aba.Icon size={17} className={ativo ? 'text-accent' : 'text-zinc-400'} />
                <span className={`text-[10px] ${ativo ? 'font-bold text-accent' : 'font-medium text-zinc-400'}`}>
                  {aba.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="h-px bg-border" />

        <div className="flex-1 overflow-y-auto pt-2">{renderSecao(cliente)}</div>
      </div>
    </div>
  )
}
