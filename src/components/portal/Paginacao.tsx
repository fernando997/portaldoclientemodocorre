interface Props {
  total: number
  pagina: number
  porPagina: number
  onChange: (pagina: number) => void
}

export function Paginacao({ total, pagina, porPagina, onChange }: Props) {
  const totalPaginas = Math.ceil(total / porPagina)
  if (totalPaginas <= 1) return null

  const inicio = Math.min((pagina - 1) * porPagina + 1, total)
  const fim = Math.min(pagina * porPagina, total)

  return (
    <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
      <span className="text-xs text-zinc-400">
        {inicio}–{fim} de {total}
      </span>
      <nav className="flex items-center gap-1">
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-zinc-100 text-lg text-zinc-500 disabled:opacity-30"
        >
          ‹
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg text-xs font-semibold ${
              p === pagina ? 'bg-accent text-white' : 'text-zinc-500'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-zinc-100 text-lg text-zinc-500 disabled:opacity-30"
        >
          ›
        </button>
      </nav>
    </div>
  )
}
