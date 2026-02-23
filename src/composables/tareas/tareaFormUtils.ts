import type { Option, ScheduleSlot } from '@/composables/tareas/tareaScheduleUtils'

export type CatalogId = number | ''

export const normalizeCatalogId = (value: unknown): CatalogId => {
  const numeric = Number(value)
  return Number.isNaN(numeric) || numeric <= 0 ? '' : numeric
}

export const resolveIdByLabel = (options: Option[], rawLabel: unknown): CatalogId => {
  const label = String(rawLabel ?? '').trim().toLowerCase()
  if (!label) return ''
  const match = options.find(option => String(option.label ?? '').trim().toLowerCase() === label)
  return normalizeCatalogId(match?.value)
}

export const toScheduleSlotsByType = (
  initialData: Record<string, any> | null | undefined,
  typeId: number,
  persistedIdKeys: string[]
): ScheduleSlot[] => {
  const horarios = Array.isArray(initialData?.horarios) ? initialData.horarios : []

  return horarios
    .filter((horario: any) => Number(horario?.tipoHorario?.id ?? horario?.tipo?.id ?? horario?.idABCCatTipoHorario ?? 0) === typeId)
    .map((horario: any) => {
      const dia = normalizeCatalogId(horario?.dia?.id)
      const hora = normalizeCatalogId(horario?.dia?.hora?.id ?? horario?.hora?.id)
      const horarioId = Number(
        persistedIdKeys
          .map(key => horario?.[key])
          .find(value => Number(value ?? 0) > 0)
          ?? horario?.horarioId
          ?? horario?.id
          ?? 0
      ) || undefined

      return {
        dia,
        hora,
        horarioId,
        persisted: true,
        activo: (horario?.activo ?? horario?.bolActivo ?? true) !== false
      }
    })
    .filter((slot: ScheduleSlot) => Boolean(slot.dia && slot.hora))
}

export const resolveMapeoIdFromInitialData = (initialData: Record<string, any>): number | '' => {
  const tareaCarga = initialData.tareasPorTipo?.carga ?? initialData.tarea
  const tareaValidacion = initialData.tareasPorTipo?.validacion ?? initialData.tarea
  const tareaEnvio = initialData.tareasPorTipo?.envio ?? initialData.tarea

  return Number(
    tareaCarga?.mapeo?.id
    ?? tareaValidacion?.mapeo?.id
    ?? tareaEnvio?.mapeo?.id
    ?? initialData.asignacion?.mapeo?.id
    ?? initialData.mapeo?.id
    ?? 0
  ) || ''
}
