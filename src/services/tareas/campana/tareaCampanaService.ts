import { api } from '../../api'
import type {
  TareaCampanaData,
  TareaCampanaHorarioPostItem,
  TareaCampanaHorariosPostPayload
} from '@/types/tareas/campana'
import { normalizeTareasCampana } from '@/adapters/tareas/campana/tareaCampana.adapter'

interface ApiClient {
  getTareasCampana(): Promise<TareaCampanaData[]>
  getTareasCampanaByLineaCampana(lineaId: string | number, campanaId: string | number): Promise<TareaCampanaData[]>
  createTareaCampana(lineaId: string | number, campanaId: string | number, payload: any): Promise<TareaCampanaData>
  getHorariosTareaCampana(tareaId: string | number): Promise<any[]>
  postHorariosTareaCampana(tareaId: string | number, payload: TareaCampanaHorariosPostPayload): Promise<any>
  patchActivarHorarioTareaCampana(tareaId: string | number, payload: any): Promise<any>
  patchDesactivarHorarioTareaCampana(tareaId: string | number, payload: any): Promise<any>
  updateTareaCampana(payload: any): Promise<TareaCampanaData>
  deleteTareaCampana(lineaId: string | number, campanaId: string | number, tareaId: string | number): Promise<void>
  patchActivarTareaCampana(payload: any): Promise<TareaCampanaData>
  patchDesactivarTareaCampana(payload: any): Promise<TareaCampanaData>
}

const apiClient = api as ApiClient

function resolveTareaCampanaId(response: any): number {
  const raw = response?.idABCConfigTareaCampana
    ?? response?.id
    ?? response?.tarea?.idABCConfigTareaCampana
    ?? response?.tarea?.id
  return Number(raw ?? 0)
}

function horarioSignature(horario: any): string {
  const dayId = Number(horario?.dia?.id ?? 0)
  const hourId = Number(horario?.dia?.hora?.id ?? horario?.hora?.id ?? 0)
  return `${dayId}|${hourId}`
}

function toHorarioPostItem(horario: any): TareaCampanaHorarioPostItem | null {
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

function normalizeHorariosForPost(horarios: any[]): TareaCampanaHorarioPostItem[] {
  return uniqueHorariosBySignature(horarios)
    .map(toHorarioPostItem)
    .filter((item): item is TareaCampanaHorarioPostItem => Boolean(item))
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
    const existing = await apiClient.getHorariosTareaCampana(tareaId).catch(() => [])
    const existingSignatures = new Set(
      (Array.isArray(existing) ? existing : []).map(horarioSignature)
    )
    const pending = uniqueHorariosBySignature(payload.horarios)
      .filter(h => !existingSignatures.has(horarioSignature(h)))

    const horarios = normalizeHorariosForPost(pending)
    if (horarios.length) {
      await apiClient.postHorariosTareaCampana(tareaId, {
        horarios,
        idUsuario: payload.idUsuario
      })
    }
  }

  if (payload.horariosActivarIds.length) {
    const uniqueIds = Array.from(new Set(payload.horariosActivarIds))
    for (const horarioId of uniqueIds) {
      await apiClient.patchActivarHorarioTareaCampana(tareaId, {
        horario: { id: horarioId },
        idUsuario: payload.idUsuario
      })
    }
  }

  if (payload.horariosDesactivarIds.length) {
    const uniqueIds = Array.from(new Set(payload.horariosDesactivarIds))
    for (const horarioId of uniqueIds) {
      await apiClient.patchDesactivarHorarioTareaCampana(tareaId, {
        horario: { id: horarioId },
        idUsuario: payload.idUsuario
      })
    }
  }
}

export const tareaCampanaService = {
  async getAll() {
    const raw = await apiClient.getTareasCampana() as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? []
    return normalizeTareasCampana(list)
  },

  async getByLineaCampana(lineaId: string | number, campanaId: string | number) {
    const raw = await apiClient.getTareasCampanaByLineaCampana(lineaId, campanaId) as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? []
    return normalizeTareasCampana(list)
  },

  async getHorariosByTarea(tareaId: string | number) {
    const raw = await apiClient.getHorariosTareaCampana(tareaId).catch(() => []) as any
    return Array.isArray(raw) ? raw : raw?.data ?? []
  },

  async create(lineaId: string | number, campanaId: string | number, payload: any) {
    const normalized = {
      tarea: payload.tarea ?? payload ?? {},
      horarios: payload.horarios ?? payload?.tarea?.horarios ?? [],
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }

    const tareaPayload = {
      tarea: normalized.tarea,
      idUsuario: normalized.idUsuario
    }
    const tareaResponse = await apiClient.createTareaCampana(lineaId, campanaId, tareaPayload)
    const tareaId = resolveTareaCampanaId(tareaResponse)

    if (tareaId && Array.isArray(normalized.horarios) && normalized.horarios.length) {
      const horarios = normalizeHorariosForPost(normalized.horarios)
      if (horarios.length) {
        await apiClient.postHorariosTareaCampana(tareaId, {
          horarios,
          idUsuario: normalized.idUsuario
        })
      }
    }

    api
      .postBitacoraByContext(
        'POST',
        `/lineas/${lineaId}/campanas/${campanaId}/tareas`,
        normalized,
        `Crear tarea campana ${campanaId} de linea ${lineaId}`,
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
    const tareaResponse = await apiClient.updateTareaCampana(tareaPayload)
    const tareaId = resolveTareaCampanaId(tareaResponse)

    await syncHorariosByTareaId(tareaId, normalized)

    api
      .postBitacoraByContext(
        'PUT',
        '/lineas/campanas/tareas',
        normalized,
        'Actualizar tarea campana',
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

  delete(lineaId: string | number, campanaId: string | number, tareaId: string | number) {
    return apiClient.deleteTareaCampana(lineaId, campanaId, tareaId)
  },

  patchActivar(tareaId: number, idUsuario: number) {
    const payload = { tarea: { id: tareaId }, idUsuario }
    return apiClient.patchActivarTareaCampana(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/campanas/tareas/activar',
          payload,
          `Activar tarea campana ${tareaId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  patchDesactivar(tareaId: number, idUsuario: number) {
    const payload = { tarea: { id: tareaId }, idUsuario }
    return apiClient.patchDesactivarTareaCampana(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/campanas/tareas/desactivar',
          payload,
          `Desactivar tarea campana ${tareaId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  }
}
