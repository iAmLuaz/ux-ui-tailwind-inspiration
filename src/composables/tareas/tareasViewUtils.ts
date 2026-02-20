export type StageKey = 'carga' | 'validacion' | 'envio'

export const stageTypeByKey: Record<StageKey, number> = {
  carga: 1,
  validacion: 2,
  envio: 3
}

export const stageKeys = Object.keys(stageTypeByKey) as StageKey[]

export function resolveMapeoDisplayName(mapeo: { nombre?: string; descripcion?: string } | undefined): string {
  const nombre = String(mapeo?.nombre ?? '').trim()
  if (nombre) return nombre
  const descripcion = String(mapeo?.descripcion ?? '').trim()
  if (descripcion) return descripcion
  return ''
}

export function resolveTareaMapeoId(item: any): number {
  return Number(
    item?.tareasPorTipo?.carga?.mapeo?.id
    ?? item?.tareasPorTipo?.validacion?.mapeo?.id
    ?? item?.tareasPorTipo?.envio?.mapeo?.id
    ?? item?.tarea?.mapeo?.id
    ?? item?.asignacion?.mapeo?.id
    ?? item?.mapeo?.id
    ?? item?.idABCConfigMapeoCampana
    ?? item?.idABCConfigMapeoLinea
    ?? 0
  )
}

export function enrichTareaWithMapeoName<T extends { ingesta?: string }>(
  item: T,
  mapeos: Array<{ idABCConfigMapeoLinea: number; nombre?: string; descripcion?: string }>
): T {
  const mapeoId = resolveTareaMapeoId(item)
  if (!mapeoId) return item

  const mapeo = mapeos.find(m => Number(m.idABCConfigMapeoLinea ?? 0) === mapeoId)
  const mapeoName = resolveMapeoDisplayName(mapeo)
  if (!mapeoName) return item

  return {
    ...item,
    ingesta: mapeoName
  }
}

export function mapCatalogosToOptions(items: { id: number; nombre: string; bolActivo: boolean }[]) {
  return items
    .filter(item => item.bolActivo !== false)
    .map(item => ({ label: item.nombre, value: item.id }))
}

export function splitHorarioIdsByStage(item: { horarios?: any[] }): Record<StageKey, number[]> {
  const byStage = {
    carga: [] as number[],
    validacion: [] as number[],
    envio: [] as number[]
  }

  const horarios = Array.isArray(item.horarios) ? item.horarios : []
  for (const horario of horarios) {
    const horarioId = Number(horario?.idABCConfigHorarioTareaLinea ?? horario?.idABCConfigHorarioTareaCampana ?? horario?.id ?? 0)
    const typeId = Number(horario?.tipoHorario?.id ?? horario?.tipo?.id ?? horario?.idABCCatTipoHorario ?? 0)
    if (!horarioId || !typeId) continue
    if (typeId === 1) byStage.carga.push(horarioId)
    if (typeId === 2) byStage.validacion.push(horarioId)
    if (typeId === 3) byStage.envio.push(horarioId)
  }

  return byStage
}
