import { create } from 'zustand'
import { useEffect } from 'react'

interface ToastItem {
  id: number
  type: 'success' | 'error'
  text: string
}

interface ToastState {
  items: ToastItem[]
  push: (item: Omit<ToastItem, 'id'>) => void
  dismiss: (id: number) => void
}

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (item) => set((s) => ({ items: [...s.items, { ...item, id: Date.now() + Math.random() }] })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))

export function showToast(type: 'success' | 'error', text: string) {
  useToastStore.getState().push({ type, text })
}

export function ToastHost() {
  const items = useToastStore((s) => s.items)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
        item.type === 'success' ? 'bg-accent' : 'bg-danger'
      }`}
    >
      {item.text}
    </div>
  )
}
