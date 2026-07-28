import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Cliente } from '@/types/cliente'

interface AuthState {
  cliente: Cliente | null
  setCliente: (cliente: Cliente) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      cliente: null,
      setCliente: (cliente) => set({ cliente }),
      logout: () => set({ cliente: null }),
    }),
    {
      name: 'portal-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
