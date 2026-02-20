import type {
  CreateTareaCampanaPayload,
  UpdateTareaCampanaPayload
} from '@/types/tareas/campana'
import type { CatalogValue } from '@/composables/tareas/tareaScheduleUtils'

export interface TareaCampanaFormModel {
  idABCCatLineaNegocio?: number | ''
  idABCCatCampana?: number | ''
  idMapeo?: number | ''
  ingesta: string
  ejecucionIngesta: CatalogValue
  diaIngesta: CatalogValue
  horaIngesta: CatalogValue
  cargaSlots?: Array<{ dia: CatalogValue; hora: CatalogValue; activo?: boolean }>
  ejecucionValidacion: CatalogValue
  diaValidacion: CatalogValue
  horaValidacion: CatalogValue
  validacionSlots?: Array<{ dia: CatalogValue; hora: CatalogValue; activo?: boolean }>
  ejecucionEnvio: CatalogValue
  diaEnvio: CatalogValue
  horaEnvio: CatalogValue
  envioSlots?: Array<{ dia: CatalogValue; hora: CatalogValue; activo?: boolean }>
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
  idUsuario?: number | ''
}

type StageName = 'carga' | 'validacion' | 'envio'

interface StageDefinition {
  stage: StageName
  typeId: 1 | 2 | 3
  execution: CatalogValue
  slots: Array<{ dia: CatalogValue; hora: CatalogValue; activo?: boolean }>
}

export interface TareaCampanaStageTaskIds {
  carga?: number
  validacion?: number
  envio?: number
}

export interface TareaCampanaUpdateOperations {
  create: Array<{ stage: StageName; payload: CreateTareaCampanaPayload }>
  update: Array<{ stage: StageName; payload: UpdateTareaCampanaPayload }>
}

export interface ActivityTypeIds {
  carga: number
  validacion: number
  envio: number
}

const DEFAULT_ACTIVITY_TYPE_IDS: ActivityTypeIds = {
  carga: 1,
  validacion: 2,
  envio: 3
}

const resolveActivityTypeIds = (input?: Partial<ActivityTypeIds>): ActivityTypeIds => ({
  carga: Number(input?.carga ?? DEFAULT_ACTIVITY_TYPE_IDS.carga) || DEFAULT_ACTIVITY_TYPE_IDS.carga,
  validacion: Number(input?.validacion ?? DEFAULT_ACTIVITY_TYPE_IDS.validacion) || DEFAULT_ACTIVITY_TYPE_IDS.validacion,
  envio: Number(input?.envio ?? DEFAULT_ACTIVITY_TYPE_IDS.envio) || DEFAULT_ACTIVITY_TYPE_IDS.envio
})

function normalizeCatalogId(value: CatalogValue): number {
  const numeric = Number(value)
  if (Number.isNaN(numeric) || numeric <= 0) return 0
  return numeric
}

function resolveExecutionId(value: CatalogValue): number {
  return normalizeCatalogId(value) || 1
}

function toHorarioByType(_typeId: 1 | 2 | 3, dia: CatalogValue, hora: CatalogValue, _tareaId?: number) {
  return {
    dia: {
      id: normalizeCatalogId(dia),
      hora: { id: normalizeCatalogId(hora) }
    }
  }
}

const normalizeSlots = (
  slots: Array<{ dia: CatalogValue; hora: CatalogValue; activo?: boolean }> | undefined,
  dia: CatalogValue,
  hora: CatalogValue
) => {
  const list = Array.isArray(slots)
    ? slots.filter(item => normalizeCatalogId(item?.dia) > 0 && normalizeCatalogId(item?.hora) > 0 && (item.activo ?? true) !== false)
    : []
  if (normalizeCatalogId(dia) > 0 && normalizeCatalogId(hora) > 0 && !list.some(item => String(item.dia) === String(dia) && String(item.hora) === String(hora))) {
    list.unshift({ dia, hora })
  }
  return list.filter(item => normalizeCatalogId(item.dia) > 0 && normalizeCatalogId(item.hora) > 0)
}

export function toCreateTareaCampanaPayloads(
  form: TareaCampanaFormModel,
  activityTypeIdsInput?: Partial<ActivityTypeIds>
): CreateTareaCampanaPayload[] {
  const activityTypeIds = resolveActivityTypeIds(activityTypeIdsInput)
  const stages: StageDefinition[] = [
    {
      stage: 'carga',
      typeId: activityTypeIds.carga as 1 | 2 | 3,
      execution: form.ejecucionIngesta,
      slots: normalizeSlots(form.cargaSlots, form.diaIngesta, form.horaIngesta)
    },
    {
      stage: 'validacion',
      typeId: activityTypeIds.validacion as 1 | 2 | 3,
      execution: form.ejecucionValidacion,
      slots: normalizeSlots(form.validacionSlots, form.diaValidacion, form.horaValidacion)
    },
    {
      stage: 'envio',
      typeId: activityTypeIds.envio as 1 | 2 | 3,
      execution: form.ejecucionEnvio,
      slots: normalizeSlots(form.envioSlots, form.diaEnvio, form.horaEnvio)
    }
  ]
  const mapeoId = Number(form.idMapeo ?? 0)

  return stages
    .filter(stage => stage.slots.length > 0)
    .map(stage => ({
      tarea: {
        mapeo: { id: mapeoId },
        tipo: { id: stage.typeId },
        ejecucion: { id: resolveExecutionId(stage.execution) }
      },
      horarios: stage.slots.map(slot => toHorarioByType(stage.typeId, slot.dia, slot.hora)),
      idABCUsuario: Number(form.idUsuario ?? 1),
      idUsuario: form.idUsuario === '' ? undefined : Number(form.idUsuario ?? 1)
    }))
}

export function toCreateTareaCampanaPayload(form: TareaCampanaFormModel): CreateTareaCampanaPayload {
  const [payload] = toCreateTareaCampanaPayloads(form)
  return payload!
}

export function toUpdateTareaCampanaPayload(
  form: TareaCampanaFormModel,
  tareaId: number
): UpdateTareaCampanaPayload {
  const ops = toUpdateTareaCampanaOperations(form, { carga: tareaId })
  return ops.update[0]?.payload ?? {
    tarea: {
      id: tareaId,
      linea: {
        id: Number(form.idABCCatLineaNegocio ?? 0),
        catCampana: {
          id: Number(form.idABCCatCampana ?? 0)
        }
      },
      tipo: { id: 1 },
      ejecucion: { id: resolveExecutionId(form.ejecucionIngesta) }
    },
    horarios: [],
    idUsuario: Number(form.idUsuario ?? 1),
    horariosDesactivarIds: [],
    horariosActivarIds: []
  }
}

export function toUpdateTareaCampanaOperations(
  form: TareaCampanaFormModel,
  taskIds: TareaCampanaStageTaskIds,
  activityTypeIdsInput?: Partial<ActivityTypeIds>
): TareaCampanaUpdateOperations {
  const activityTypeIds = resolveActivityTypeIds(activityTypeIdsInput)
  const mapeoId = Number(form.idMapeo ?? 0)
  const idUsuario = Number(form.idUsuario ?? 1)
  const horariosDesactivarIds = Array.isArray(form.horariosDesactivarIds)
    ? form.horariosDesactivarIds.map(Number).filter(id => !Number.isNaN(id) && id > 0)
    : []
  const horariosActivarIds = Array.isArray(form.horariosActivarIds)
    ? form.horariosActivarIds.map(Number).filter(id => !Number.isNaN(id) && id > 0)
    : []

  const stages: StageDefinition[] = [
    {
      stage: 'carga',
      typeId: activityTypeIds.carga as 1 | 2 | 3,
      execution: form.ejecucionIngesta,
      slots: normalizeSlots(form.cargaSlots, form.diaIngesta, form.horaIngesta)
    },
    {
      stage: 'validacion',
      typeId: activityTypeIds.validacion as 1 | 2 | 3,
      execution: form.ejecucionValidacion,
      slots: normalizeSlots(form.validacionSlots, form.diaValidacion, form.horaValidacion)
    },
    {
      stage: 'envio',
      typeId: activityTypeIds.envio as 1 | 2 | 3,
      execution: form.ejecucionEnvio,
      slots: normalizeSlots(form.envioSlots, form.diaEnvio, form.horaEnvio)
    }
  ]

  const create: Array<{ stage: StageName; payload: CreateTareaCampanaPayload }> = []
  const update: Array<{ stage: StageName; payload: UpdateTareaCampanaPayload }> = []

  for (const stage of stages) {
    if (!stage.slots.length) continue

    const commonTarea = {
      ...(mapeoId > 0 ? { mapeo: { id: mapeoId } } : {}),
      linea: {
        id: Number(form.idABCCatLineaNegocio ?? 0),
        catCampana: {
          id: Number(form.idABCCatCampana ?? 0)
        }
      },
      tipo: { id: stage.typeId },
      ejecucion: { id: resolveExecutionId(stage.execution) }
    }

    const existingTaskId = Number(taskIds[stage.stage] ?? 0)
    if (existingTaskId > 0) {
      update.push({
        stage: stage.stage,
        payload: {
          tarea: {
            id: existingTaskId,
            ...commonTarea
          },
          horarios: stage.slots.map(slot => toHorarioByType(stage.typeId, slot.dia, slot.hora, existingTaskId)),
          idUsuario,
          horariosDesactivarIds,
          horariosActivarIds
        }
      })
      continue
    }

    create.push({
      stage: stage.stage,
      payload: {
        tarea: commonTarea,
        horarios: stage.slots.map(slot => toHorarioByType(stage.typeId, slot.dia, slot.hora)),
        idABCUsuario: idUsuario,
        idUsuario
      }
    })
  }

  return { create, update }
}
