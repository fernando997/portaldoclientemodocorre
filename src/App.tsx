import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { LoginPage } from '@/pages/LoginPage'
import { PortalPage } from '@/pages/PortalPage'
import { ToastHost } from '@/components/Toast'

function RequireAuth({ children }: { children: ReactNode }) {
  const cliente = useAuthStore((s) => s.cliente)
  if (!cliente) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
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
