import type { TareaLineaFormModel } from '@/models/tareas/linea/tareaLinea.model'
import type { TareaCampanaFormModel } from '@/models/tareas/campana/tareaCampana.model'
import { toCreateTareaLineaPayloads, toUpdateTareaLineaOperations } from '@/models/tareas/linea/tareaLinea.model'
import { toCreateTareaCampanaPayloads, toUpdateTareaCampanaOperations } from '@/models/tareas/campana/tareaCampana.model'
import { stageKeys } from '@/composables/tareas/tareasViewUtils'

export type SaveAction = {
  label: string
  run: () => Promise<void>
}

type StageKey = 'carga' | 'validacion' | 'envio'

type StageTaskIds = {
  carga?: number
  validacion?: number
  envio?: number
}

type StageAwareItem = {
  idsTarea?: Partial<Record<StageKey, number>>
  tareasPorTipo?: Partial<Record<StageKey, Record<string, unknown>>>
  carga?: Record<string, unknown>
  validacion?: Record<string, unknown>
  envio?: Record<string, unknown>
}

type ActivityTypeIds = {
  carga: number
  validacion: number
  envio: number
}

type HorarioPayload = {
  horarios?: any[]
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
}

type CampanaServiceLike = {
  create: (lineaId: number, campanaId: number, payload: any) => Promise<unknown>
  update: (payload: any) => Promise<unknown>
  syncHorarios: (taskId: number, payload: any) => Promise<unknown>
}

type LineaServiceLike = {
  create: (lineaId: number, payload: any) => Promise<unknown>
  update: (payload: any) => Promise<unknown>
  syncHorarios: (taskId: number, payload: any) => Promise<unknown>
}

export function stageActionLabel(stage: StageKey) {
  if (stage === 'carga') return 'carga'
  if (stage === 'validacion') return 'validación'
  return 'envío'
}

export function resolveStageTaskIds(item: StageAwareItem): StageTaskIds {
  return {
    carga: Number(item.idsTarea?.carga ?? item.tareasPorTipo?.carga?.id ?? item.tareasPorTipo?.carga?.idABCConfigTareaLinea ?? item.tareasPorTipo?.carga?.idABCConfigTareaCampana ?? 0) || undefined,
    validacion: Number(item.idsTarea?.validacion ?? item.tareasPorTipo?.validacion?.id ?? item.tareasPorTipo?.validacion?.idABCConfigTareaLinea ?? item.tareasPorTipo?.validacion?.idABCConfigTareaCampana ?? 0) || undefined,
    envio: Number(item.idsTarea?.envio ?? item.tareasPorTipo?.envio?.id ?? item.tareasPorTipo?.envio?.idABCConfigTareaLinea ?? item.tareasPorTipo?.envio?.idABCConfigTareaCampana ?? 0) || undefined
  }
}

function toPositiveIds(values: unknown[]): number[] {
  return values
    .map(value => Number(value))
    .filter(id => !Number.isNaN(id) && id > 0)
}

function uniqueIds(values: number[]): number[] {
  return Array.from(new Set(values))
}

function hasHorarioChanges(payload: HorarioPayload) {
  return Boolean(
    (payload.horarios?.length ?? 0) > 0
    || (payload.horariosDesactivarIds?.length ?? 0) > 0
    || (payload.horariosActivarIds?.length ?? 0) > 0
  )
}

function resolveCurrentExecutionIdByStage(item: StageAwareItem, stage: StageKey) {
  const stageTask = item?.tareasPorTipo?.[stage] as any
  const stageSummary = item?.[stage] as any
  return Number(
    stageTask?.ejecucion?.id
    ?? stageSummary?.ejecucionId
    ?? 0
  )
}

function shouldUpdateStageTask(item: StageAwareItem, stage: StageKey, nextExecutionId: number) {
  const currentExecutionId = resolveCurrentExecutionIdByStage(item, stage)
  return currentExecutionId !== nextExecutionId
}

function toTaskOnlyUpdatePayload(payloadByStage: any) {
  return {
    tarea: payloadByStage?.tarea ?? {},
    idUsuario: Number(payloadByStage?.idUsuario ?? payloadByStage?.idABCUsuario ?? 1)
  }
}

export function buildForcedHorarioSyncByStage(
  payload: any,
  stageTaskIds: StageTaskIds
) {
  const idUsuario = Number(payload?.idUsuario ?? payload?.idABCUsuario ?? 1)
  const globalDesactivarIds = toPositiveIds(Array.isArray(payload?.horariosDesactivarIds) ? payload.horariosDesactivarIds : [])
  const globalActivarIds = toPositiveIds(Array.isArray(payload?.horariosActivarIds) ? payload.horariosActivarIds : [])

  const forcedSyncEntries = stageKeys
    .map(stage => {
      const taskId = Number(stageTaskIds[stage] ?? 0)
      if (!taskId) return null

      const stageSlots = Array.isArray(payload?.[`${stage}Slots`]) ? payload[`${stage}Slots`] : []
      const stageHorarioIds = new Set(
        toPositiveIds(stageSlots.map((slot: any) => slot?.horarioId))
      )

      const inferredDesactivarIds = toPositiveIds(
        stageSlots
          .filter((slot: any) => Number(slot?.horarioId ?? 0) > 0 && (slot?.activo ?? true) === false)
          .map((slot: any) => slot?.horarioId)
      )

      const horariosDesactivarIds = uniqueIds([
        ...globalDesactivarIds.filter(id => stageHorarioIds.has(id)),
        ...inferredDesactivarIds
      ])

      const horariosActivarIds = uniqueIds(
        globalActivarIds.filter(id => stageHorarioIds.has(id))
      )

      if (!horariosDesactivarIds.length && !horariosActivarIds.length) return null

      return {
        stage,
        taskId,
        payload: {
          horarios: [],
          idUsuario,
          horariosDesactivarIds,
          horariosActivarIds
        }
      }
    })
    .filter((item): item is { stage: StageKey; taskId: number; payload: any } => Boolean(item))

  return forcedSyncEntries
}

export function buildCampanaSaveActions(params: {
  mode: 'add' | 'edit'
  payload: TareaCampanaFormModel
  selectedItem: StageAwareItem | null
  lineaId: number
  campanaId: number
  actividadTipoIds: ActivityTypeIds
  service: CampanaServiceLike
  refresh: () => Promise<void>
}) {
  const {
    mode,
    payload,
    selectedItem,
    lineaId,
    campanaId,
    actividadTipoIds,
    service,
    refresh
  } = params

  const actions: SaveAction[] = []

  if (mode === 'add') {
    const payloads = toCreateTareaCampanaPayloads(payload, actividadTipoIds)
    for (const record of payloads) {
      const stageId = Number(record?.tarea?.tipo?.id ?? 0)
      const stage = stageId === 1 ? 'carga' : stageId === 2 ? 'validacion' : 'envio'
      actions.push({
        label: `Agregando ${stageActionLabel(stage)}`,
        run: async () => {
          await service.create(lineaId, campanaId, record)
        }
      })
    }
  } else if (selectedItem) {
    const stageTaskIds = resolveStageTaskIds(selectedItem)
    const operations = toUpdateTareaCampanaOperations(payload, stageTaskIds, actividadTipoIds)
    const syncedHorarioStages = new Set<string>()

    for (const entry of operations.update) {
      const payloadByStage = entry.payload
      const stageTaskId = Number(
        payloadByStage?.tarea?.id
        ?? stageTaskIds[entry.stage]
        ?? 0
      )

      const requiresTaskPut = shouldUpdateStageTask(
        selectedItem,
        entry.stage,
        Number(payloadByStage?.tarea?.ejecucion?.id ?? 0)
      )

      if (requiresTaskPut) {
        actions.push({
          label: `Actualizando ${stageActionLabel(entry.stage)}`,
          run: async () => {
            await service.update(toTaskOnlyUpdatePayload(payloadByStage))
          }
        })
      }

      if (stageTaskId > 0 && hasHorarioChanges(payloadByStage)) {
        syncedHorarioStages.add(entry.stage)
        actions.push({
          label: `Sincronizando horarios de ${stageActionLabel(entry.stage)}`,
          run: async () => {
            await service.syncHorarios(stageTaskId, payloadByStage)
          }
        })
      }
    }

    for (const forcedSync of buildForcedHorarioSyncByStage(payload, stageTaskIds)) {
      if (syncedHorarioStages.has(forcedSync.stage)) continue
      actions.push({
        label: `Sincronizando horarios de ${stageActionLabel(forcedSync.stage)}`,
        run: async () => {
          await service.syncHorarios(forcedSync.taskId, forcedSync.payload)
        }
      })
    }

    for (const entry of operations.create) {
      actions.push({
        label: `Agregando ${stageActionLabel(entry.stage)}`,
        run: async () => {
          await service.create(lineaId, campanaId, entry.payload)
        }
      })
    }
  }

  actions.push({
    label: 'Actualizando tabla de campañas',
    run: refresh
  })

  return actions
}

export function buildLineaSaveActions(params: {
  mode: 'add' | 'edit'
  payload: TareaLineaFormModel
  selectedItem: StageAwareItem | null
  lineaId: number
  actividadTipoIds: ActivityTypeIds
  service: LineaServiceLike
  refresh: () => Promise<void>
}) {
  const {
    mode,
    payload,
    selectedItem,
    lineaId,
    actividadTipoIds,
    service,
    refresh
  } = params

  const actions: SaveAction[] = []

  if (mode === 'add') {
    const payloads = toCreateTareaLineaPayloads(payload, actividadTipoIds)
    for (const record of payloads) {
      const stageId = Number(record?.tarea?.tipo?.id ?? 0)
      const stage = stageId === 1 ? 'carga' : stageId === 2 ? 'validacion' : 'envio'
      actions.push({
        label: `Agregando ${stageActionLabel(stage)}`,
        run: async () => {
          await service.create(lineaId, record)
        }
      })
    }
  } else if (selectedItem) {
    const stageTaskIds = resolveStageTaskIds(selectedItem)
    const operations = toUpdateTareaLineaOperations(payload, stageTaskIds, actividadTipoIds)
    const syncedHorarioStages = new Set<string>()

    for (const entry of operations.update) {
      const payloadByStage = entry.payload
      const stageTaskId = Number(
        payloadByStage?.tarea?.id
        ?? stageTaskIds[entry.stage]
        ?? 0
      )

      const requiresTaskPut = shouldUpdateStageTask(
        selectedItem,
        entry.stage,
        Number(payloadByStage?.tarea?.ejecucion?.id ?? 0)
      )

      if (requiresTaskPut) {
        actions.push({
          label: `Actualizando ${stageActionLabel(entry.stage)}`,
          run: async () => {
            await service.update(toTaskOnlyUpdatePayload(payloadByStage))
          }
        })
      }

      if (stageTaskId > 0 && hasHorarioChanges(payloadByStage)) {
        syncedHorarioStages.add(entry.stage)
        actions.push({
          label: `Sincronizando horarios de ${stageActionLabel(entry.stage)}`,
          run: async () => {
            await service.syncHorarios(stageTaskId, payloadByStage)
          }
        })
      }
    }

    for (const forcedSync of buildForcedHorarioSyncByStage(payload, stageTaskIds)) {
      if (syncedHorarioStages.has(forcedSync.stage)) continue
      actions.push({
        label: `Sincronizando horarios de ${stageActionLabel(forcedSync.stage)}`,
        run: async () => {
          await service.syncHorarios(forcedSync.taskId, forcedSync.payload)
        }
      })
    }

    for (const entry of operations.create) {
      actions.push({
        label: `Agregando ${stageActionLabel(entry.stage)}`,
        run: async () => {
          await service.create(lineaId, entry.payload)
        }
      })
    }
  }

  actions.push({
    label: 'Actualizando tabla de líneas',
    run: refresh
  })

  return actions
}
