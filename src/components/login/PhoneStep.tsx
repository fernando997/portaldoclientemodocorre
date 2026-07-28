import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatPhoneBR } from '@/lib/format-phone'

const schema = z.object({
  celular: z
    .string()
    .min(15, 'Número incompleto')
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato inválido'),
})

type FormData = z.infer<typeof schema>

interface Props {
  onSubmit: (celular: string) => Promise<void>
  loading: boolean
}

export function PhoneStep({ onSubmit, loading }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { celular: '' },
  })

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.celular))}>
      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium tracking-wide text-text-faint">
          Número de celular
        </label>
        <Controller
          name="celular"
          control={control}
          render={({ field }) => (
            <input
              value={field.value}
              onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              className={`w-full rounded-[14px] border bg-input-bg px-[18px] py-4 text-base text-text-light placeholder:text-text-faint focus:outline-none ${
                errors.celular ? 'border-danger' : 'border-input-border'
              }`}
            />
          )}
        />
        {errors.celular && (
          <p className="mt-1.5 text-xs text-red-400">{errors.celular.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-[14px] bg-accent py-[17px] text-base font-bold tracking-wide text-text-light shadow-[0_6px_12px_-2px_rgba(59,160,103,0.4)] disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? 'Enviando...' : 'Enviar código'}
      </button>
    </form>
  )
}
