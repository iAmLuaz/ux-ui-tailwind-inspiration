import { api } from '../../api'
import type {
  TareaLineaData,
  TareaLineaHorarioPostItem,
  TareaLineaHorariosPostPayload
} from '@/types/tareas/linea'
import { normalizeTareasLinea } from '@/adapters/tareas/linea/tareaLinea.adapter'

interface ApiClient {
  getTareasLinea(): Promise<TareaLineaData[]>
  getTareasLineaByLinea(lineaId: string | number): Promise<TareaLineaData[]>
  createTareaLinea(lineaId: string | number, payload: any): Promise<TareaLineaData>
  getHorariosTareaLinea(tareaId: string | number): Promise<any[]>
  postHorariosTareaLinea(tareaId: string | number, payload: TareaLineaHorariosPostPayload): Promise<any>
  patchActivarHorarioTareaLinea(tareaId: string | number, payload: any): Promise<any>
  patchDesactivarHorarioTareaLinea(tareaId: string | number, payload: any): Promise<any>
  updateTareaLinea(payload: any): Promise<TareaLineaData>
  deleteTareaLinea(lineaId: string | number, tareaId: string | number): Promise<void>
  patchActivarTareaLinea(payload: any): Promise<TareaLineaData>
  patchDesactivarTareaLinea(payload: any): Promise<TareaLineaData>
}

const apiClient = api as ApiClient

function resolveTareaLineaId(response: any): number {
  const raw = response?.idABCConfigTareaLinea
    ?? response?.id
    ?? response?.tarea?.idABCConfigTareaLinea
    ?? response?.tarea?.id
  return Number(raw ?? 0)
}

function horarioSignature(horario: any): string {
  const dayId = Number(horario?.dia?.id ?? 0)
  const hourId = Number(horario?.dia?.hora?.id ?? horario?.hora?.id ?? 0)
  return `${dayId}|${hourId}`
}

function toHorarioPostItem(horario: any): TareaLineaHorarioPostItem | null {
  const dayId = Number(horario?.dia?.id ?? 0)
  const hourId = Number(horario?.dia?.hora?.id ?? horario?.hora?.id ?? 0)
  if (!dayId || !hourId) return null

  return {
    dia: {
      id: dayId,
      hora: { id: hourId }
    }
  }
}

function normalizeHorariosForPost(horarios: any[]): TareaLineaHorarioPostItem[] {
  return uniqueHorariosBySignature(horarios)
    .map(toHorarioPostItem)
    .filter((item): item is TareaLineaHorarioPostItem => Boolean(item))
}

function uniqueHorariosBySignature(horarios: any[]): any[] {
  const seen = new Set<string>()
  const result: any[] = []

  for (const horario of horarios) {
    const key = horarioSignature(horario)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(horario)
  }

  return result
}

async function syncHorariosByTareaId(
  tareaId: number,
  payload: {
    horarios: any[]
    idUsuario: number
    horariosDesactivarIds: number[]
    horariosActivarIds: number[]
  }
) {
  if (!tareaId || tareaId <= 0) return

  if (Array.isArray(payload.horarios) && payload.horarios.length) {
    const existing = await apiClient.getHorariosTareaLinea(tareaId).catch(() => [])
    const existingSignatures = new Set(
      (Array.isArray(existing) ? existing : []).map(horarioSignature)
    )
    const pending = uniqueHorariosBySignature(payload.horarios)
      .filter(h => !existingSignatures.has(horarioSignature(h)))

    const horarios = normalizeHorariosForPost(pending)
    if (horarios.length) {
      await apiClient.postHorariosTareaLinea(tareaId, {
        horarios,
        idUsuario: payload.idUsuario
      })
    }
  }

  if (payload.horariosActivarIds.length) {
    const uniqueIds = Array.from(new Set(payload.horariosActivarIds))
    for (const horarioId of uniqueIds) {
      await apiClient.patchActivarHorarioTareaLinea(tareaId, {
        horario: { id: horarioId },
        idUsuario: payload.idUsuario
      })
    }
  }

  if (payload.horariosDesactivarIds.length) {
    const uniqueIds = Array.from(new Set(payload.horariosDesactivarIds))
    for (const horarioId of uniqueIds) {
      await apiClient.patchDesactivarHorarioTareaLinea(tareaId, {
        horario: { id: horarioId },
        idUsuario: payload.idUsuario
      })
    }
  }
}

export const tareaLineaService = {
  async getAll() {
    const raw = await apiClient.getTareasLinea() as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? []
    return normalizeTareasLinea(list)
  },

  async getByLinea(lineaId: string | number) {
    const raw = await apiClient.getTareasLineaByLinea(lineaId) as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? []
    return normalizeTareasLinea(list)
  },

  async getHorariosByTarea(tareaId: string | number) {
    const raw = await apiClient.getHorariosTareaLinea(tareaId).catch(() => []) as any
    return Array.isArray(raw) ? raw : raw?.data ?? []
  },

  async create(lineaId: string | number, payload: any) {
    const normalized = {
      tarea: payload.tarea ?? payload ?? {},
      horarios: payload.horarios ?? payload?.tarea?.horarios ?? [],
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }

    const tareaPayload = {
      tarea: normalized.tarea,
      idUsuario: normalized.idUsuario
    }
    const tareaResponse = await apiClient.createTareaLinea(lineaId, tareaPayload)
    const tareaId = resolveTareaLineaId(tareaResponse)

    if (tareaId && Array.isArray(normalized.horarios) && normalized.horarios.length) {
      const horarios = normalizeHorariosForPost(normalized.horarios)
      if (horarios.length) {
        await apiClient.postHorariosTareaLinea(tareaId, {
          horarios,
          idUsuario: normalized.idUsuario
        })
      }
    }

    api
      .postBitacoraByContext(
        'POST',
        `/lineas/${lineaId}/tareas`,
        normalized,
        `Crear tarea linea ${lineaId}`,
        normalized.idUsuario
      )
      .catch(() => {})

    return tareaResponse
  },

  async update(payload: any) {
    const tareaData = payload.tarea ?? payload ?? {}
    const horariosDesactivarIds = Array.isArray(payload.horariosDesactivarIds)
      ? payload.horariosDesactivarIds.map(Number).filter((id: number) => !Number.isNaN(id) && id > 0)
      : []
    const horariosActivarIds = Array.isArray(payload.horariosActivarIds)
      ? payload.horariosActivarIds.map(Number).filter((id: number) => !Number.isNaN(id) && id > 0)
      : []
    const normalized = {
      tarea: tareaData,
      horarios: payload.horarios ?? payload?.tarea?.horarios ?? [],
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      horariosDesactivarIds,
      horariosActivarIds
    }

    const tareaPayload = {
      tarea: normalized.tarea,
      idUsuario: normalized.idUsuario
    }
    const tareaResponse = await apiClient.updateTareaLinea(tareaPayload)
    const tareaId = resolveTareaLineaId(tareaResponse)

    await syncHorariosByTareaId(tareaId, normalized)

    api
      .postBitacoraByContext(
        'PUT',
        '/lineas/tareas',
        normalized,
        'Actualizar tarea linea',
        normalized.idUsuario
      )
      .catch(() => {})

    return tareaResponse
  },

  async syncHorarios(tareaId: number, payload: any) {
    const normalized = {
      horarios: payload?.horarios ?? [],
      idUsuario: Number(payload?.idUsuario ?? payload?.idABCUsuario ?? 1),
      horariosDesactivarIds: Array.isArray(payload?.horariosDesactivarIds)
        ? payload.horariosDesactivarIds.map(Number).filter((id: number) => !Number.isNaN(id) && id > 0)
        : [],
      horariosActivarIds: Array.isArray(payload?.horariosActivarIds)
        ? payload.horariosActivarIds.map(Number).filter((id: number) => !Number.isNaN(id) && id > 0)
        : []
    }

    await syncHorariosByTareaId(Number(tareaId ?? 0), normalized)
  },

  delete(lineaId: string | number, tareaId: string | number) {
    return apiClient.deleteTareaLinea(lineaId, tareaId)
  },

  patchActivar(tareaId: number, idUsuario: number) {
    const payload = { tarea: { id: tareaId }, idUsuario }
    return apiClient.patchActivarTareaLinea(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/tareas/activar',
          payload,
          `Activar tarea ${tareaId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  patchDesactivar(tareaId: number, idUsuario: number) {
    const payload = { tarea: { id: tareaId }, idUsuario }
    return apiClient.patchDesactivarTareaLinea(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/tareas/desactivar',
          payload,
          `Desactivar tarea ${tareaId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  }
}
