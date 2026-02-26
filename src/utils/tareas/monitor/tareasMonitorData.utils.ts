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

export function mapIdLabelOptions(mapById: Map<number, string>) {
  return Array.from(mapById.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function resolveMapeoName(
  mapeoId: number,
  type: 'linea' | 'campana',
  mapeoLineaNameById: Map<number, string>,
  mapeoCampanaNameById: Map<number, string>
) {
  if (!mapeoId) return ''
  if (type === 'campana') {
    return mapeoCampanaNameById.get(mapeoId)
      ?? mapeoLineaNameById.get(mapeoId)
      ?? `Mapeo ${mapeoId}`
  }
  return mapeoLineaNameById.get(mapeoId)
    ?? mapeoCampanaNameById.get(mapeoId)
    ?? `Mapeo ${mapeoId}`
}
