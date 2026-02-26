export function formatDateLabel(value?: string) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
}

export function formatTimeLabel(value?: string) {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export function formatNumber(value?: number) {
  const parsed = Number(value ?? 0)
  if (!Number.isFinite(parsed)) return '0'
  return parsed.toLocaleString('es-MX')
}

export function getStatusClassByCode(code: string) {
  if (code === 'EJC') return 'bg-blue-50 text-[#00357F] border border-blue-200'
  if (code === 'CMP') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (code === 'ERR') return 'bg-red-50 text-[#AD0A0A] border border-red-200'
  if (code === 'BLQ') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (code === 'CNC') return 'bg-slate-50 text-slate-500 border border-slate-200'
  return 'bg-slate-50 text-slate-600 border border-slate-200'
}
