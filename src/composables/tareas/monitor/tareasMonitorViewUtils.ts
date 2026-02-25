import type { CatalogoGrupo } from '@/types/catalogos/catalogos'

export function mapCatalogIdToLabel(catalogos: CatalogoGrupo[], code: string) {
  const registros = catalogos.find(group => String(group.codigo).toUpperCase() === code)?.registros ?? []
  return new Map(registros.map(item => [Number(item.id), item.nombre]))
}

export function mapCatalogIdToCode(catalogos: CatalogoGrupo[], code: string) {
  const registros = catalogos.find(group => String(group.codigo).toUpperCase() === code)?.registros ?? []
  return new Map(registros.map(item => [Number(item.id), String(item.codigo).toUpperCase()]))
}

export function mapMapeoNameById(mapeos: any[]) {
  return new Map(
    mapeos
      .map(item => {
        const id = Number(item?.idABCConfigMapeoLinea ?? item?.id ?? 0)
        const nombre = String(item?.nombre ?? '').trim()
        return [id, nombre] as const
      })
      .filter(([id, nombre]) => id > 0 && !!nombre)
  )
}

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