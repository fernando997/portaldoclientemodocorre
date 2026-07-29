import type { Cliente } from '@/types/cliente'

function formatarData(iso: string) {
  return iso.split('-').reverse().join('/')
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="w-[47%]">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="text-sm font-bold text-zinc-900">{valor || '—'}</p>
    </div>
  )
}

interface Props {
  cliente: Cliente
}

export function MeusDados({ cliente }: Props) {
  const contrato = cliente.contratos[0]

  const iniciais = cliente.nome_completo
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  if (!contrato) {
    return (
      <div className="px-4">
        <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Meus dados</h2>
        <p className="text-sm text-zinc-400">Nenhum contrato encontrado.</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto px-4">
      <h2 className="mb-4 mt-2 text-xl font-bold text-zinc-900">Meus dados</h2>

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-3.5 border-b border-zinc-100 pb-4">
          {cliente.foto_url ? (
            <img src={cliente.foto_url} alt={cliente.nome_completo} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <span className="text-base font-bold text-white">{iniciais}</span>
            </div>
          )}
          <p className="flex-1 text-base font-bold text-zinc-900">{cliente.nome_completo}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Campo label="Contrato" valor={String(contrato.numero)} />
          <Campo label="CPF" valor={cliente.cpf} />
          <Campo label="Placa" valor={contrato.veiculo.placa} />
          <Campo label="Validade da CNH" valor={formatarData(contrato.validade_cnh)} />
          <Campo label="Telefone" valor={cliente.celular} />
          <Campo label="E-mail" valor={cliente.email} />
          <Campo label="Fiador" valor={contrato.fiador} />
          <Campo label="CPF do fiador" valor={contrato.cpf_fiador} />
          <Campo label="Telefone do fiador" valor={contrato.telefone_fiador} />
        </div>
      </div>

      <div className="h-8" />
    </div>
  )
}
