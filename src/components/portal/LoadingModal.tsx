export function LoadingModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-white px-10 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
        <p className="mt-3 text-[15px] font-semibold text-zinc-700">Carregando...</p>
        <p className="text-[13px] text-zinc-400">Buscando seu pagamento</p>
      </div>
    </div>
  )
}
