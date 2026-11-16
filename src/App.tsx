import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { PORTAL_WEB_ATIVO } from '@/config/app-nativo'
import { LoginPage } from '@/pages/LoginPage'
import { PortalPage } from '@/pages/PortalPage'
import { BaixeOAppPage } from '@/pages/BaixeOAppPage'
import { ToastHost } from '@/components/Toast'

function RequireAuth({ children }: { children: ReactNode }) {
  const cliente = useAuthStore((s) => s.cliente)
  if (!cliente) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  // Portal desligado: qualquer endereço cai na página de download, inclusive
  // /portal e os atalhos que o cliente tenha salvo. Não há login nem rota de
  // escape — o atendimento vive nos aplicativos nativos.
  if (!PORTAL_WEB_ATIVO) {
    return (
      <Routes>
        <Route path="*" element={<BaixeOAppPage />} />
      </Routes>
    )
  }

  return (
    <>
      <ToastHost />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/portal"
          element={
            <RequireAuth>
              <PortalPage />
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default App
