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

const normalizeStageToken = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

function resolveStageFromHorario(item: any, horario: any): StageKey | null {
  const horarioTypeId = Number(horario?.tipoHorario?.id ?? horario?.tipo?.id ?? horario?.idABCCatTipoHorario ?? 0)

  const stageTypeIds: Record<StageKey, number> = {
    carga: Number(item?.tareasPorTipo?.carga?.tipo?.id ?? 0),
    validacion: Number(item?.tareasPorTipo?.validacion?.tipo?.id ?? 0),
    envio: Number(item?.tareasPorTipo?.envio?.tipo?.id ?? 0)
  }

  if (horarioTypeId > 0) {
    if (stageTypeIds.carga > 0 && horarioTypeId === stageTypeIds.carga) return 'carga'
    if (stageTypeIds.validacion > 0 && horarioTypeId === stageTypeIds.validacion) return 'validacion'
    if (stageTypeIds.envio > 0 && horarioTypeId === stageTypeIds.envio) return 'envio'

    if (horarioTypeId === 1) return 'carga'
    if (horarioTypeId === 2) return 'validacion'
    if (horarioTypeId === 3) return 'envio'
  }

  const typeCode = normalizeStageToken(horario?.tipoHorario?.codigo ?? horario?.tipo?.codigo)
  if (typeCode === 'CAG') return 'carga'
  if (typeCode === 'VLD') return 'validacion'
  if (typeCode === 'ENV') return 'envio'

  const typeName = normalizeStageToken(horario?.tipoHorario?.nombre ?? horario?.tipo?.nombre)
  if (typeName === 'CARGA') return 'carga'
  if (typeName === 'VALIDACION') return 'validacion'
  if (typeName === 'ENVIO') return 'envio'

  return null
}

export function splitHorarioIdsByStage(item: { horarios?: any[]; tareasPorTipo?: any }): Record<StageKey, number[]> {
  const byStage = {
    carga: [] as number[],
    validacion: [] as number[],
    envio: [] as number[]
  }

  const horarios = Array.isArray(item.horarios) ? item.horarios : []
  for (const horario of horarios) {
    const horarioId = Number(horario?.idABCConfigHorarioTareaLinea ?? horario?.idABCConfigHorarioTareaCampana ?? horario?.id ?? 0)
    if (!horarioId) continue

    const stageKey = resolveStageFromHorario(item, horario)
    if (!stageKey) continue
    byStage[stageKey].push(horarioId)
  }

  return byStage
}
