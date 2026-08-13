export function timestampParaDataLocal(ts: number, timeZone = 'America/Sao_Paulo'): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(ts))
  const ano = partes.find((p) => p.type === 'year')!.value
  const mes = partes.find((p) => p.type === 'month')!.value
  const dia = partes.find((p) => p.type === 'day')!.value
  return `${ano}-${mes}-${dia}`
}

export function somarMesesData(dataISO: string, meses: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const base = new Date(Date.UTC(ano, mes - 1, dia))
  base.setUTCMonth(base.getUTCMonth() + meses)
  return base.toISOString().split('T')[0]
}
