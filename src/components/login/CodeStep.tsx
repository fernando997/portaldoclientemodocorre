import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  codigo: z
    .string()
    .length(6, 'O código deve ter 6 dígitos')
    .regex(/^\d{6}$/, 'Somente números'),
})

type FormData = z.infer<typeof schema>

interface Props {
  celular: string
  onSubmit: (codigo: string) => void
  onVoltar: () => void
  loading: boolean
}

export function CodeStep({ celular, onSubmit, onVoltar, loading }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { codigo: '' },
  })

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.codigo))}>
      <div className="mb-6 rounded-xl border border-input-border bg-input-bg px-4 py-3.5">
        <p className="text-[13px] leading-5 text-text-faint">
          Código enviado via WhatsApp para
          <br />
          <span className="font-bold text-text-light">{celular}</span>
        </p>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium tracking-wide text-text-faint">
          Código de 6 dígitos
        </label>
        <Controller
          name="codigo"
          control={control}
          render={({ field }) => (
            <input
              value={field.value}
              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="· · · · · ·"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              className={`w-full rounded-[14px] border bg-input-bg px-[18px] py-[18px] text-center text-2xl font-bold tracking-[0.5em] text-text-light placeholder:text-text-faint focus:outline-none ${
                errors.codigo ? 'border-danger' : 'border-input-border'
              }`}
            />
          )}
        />
        {errors.codigo && (
          <p className="mt-1.5 text-xs text-red-400">{errors.codigo.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mb-3 w-full rounded-[14px] bg-accent py-[17px] text-base font-bold tracking-wide text-text-light shadow-[0_6px_12px_-2px_rgba(59,160,103,0.4)] disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? 'Verificando...' : 'Confirmar acesso'}
      </button>

      <button
        type="button"
        onClick={onVoltar}
        className="w-full py-3 text-center text-[13px] font-medium text-text-faint"
      >
        Voltar e trocar número
      </button>
    </form>
  )
}
