import { api } from '../../api'
import type { TareaCampanaData } from '@/types/tareas/campana'
import { normalizeTareasCampana } from '@/adapters/tareas/campana/tareaCampana.adapter'

interface ApiClient {
  getTareasCampana(): Promise<TareaCampanaData[]>
  getTareasCampanaByLineaCampana(lineaId: string | number, campanaId: string | number): Promise<TareaCampanaData[]>
  createTareaCampana(lineaId: string | number, campanaId: string | number, payload: any): Promise<TareaCampanaData>
  getHorariosTareaCampana(tareaId: string | number): Promise<any[]>
  postHorariosTareaCampana(tareaId: string | number, payload: any): Promise<any>
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
  const typeId = Number(horario?.tipoHorario?.id ?? horario?.tipo?.id ?? horario?.idABCCatTipoHorario ?? 0)
  const dayId = Number(horario?.dia?.id ?? 0)
  const hourId = Number(horario?.dia?.hora?.id ?? horario?.hora?.id ?? 0)
  return `${typeId}|${dayId}|${hourId}`
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

export const tareaCampanaService = {
  async getAll() {
    const raw = await apiClient.getTareasCampana() as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? []
    const withHorarios = await Promise.all(
      list.map(async (item: any) => {
        if (Array.isArray(item?.horarios) || Array.isArray(item?.tarea?.horarios)) {
          return item
        }
        const tareaId = Number(item?.idABCConfigTareaCampana ?? item?.id ?? item?.tarea?.idABCConfigTareaCampana ?? item?.tarea?.id ?? 0)
        if (!tareaId) return item
        const horarios = await apiClient.getHorariosTareaCampana(tareaId).catch(() => [])
        return {
          ...item,
          horarios
        }
      })
    )

    return normalizeTareasCampana(withHorarios)
  },

  async getByLineaCampana(lineaId: string | number, campanaId: string | number) {
    const raw = await apiClient.getTareasCampanaByLineaCampana(lineaId, campanaId) as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? []
    const withHorarios = await Promise.all(
      list.map(async (item: any) => {
        if (Array.isArray(item?.horarios) || Array.isArray(item?.tarea?.horarios)) {
          return item
        }
        const tareaId = Number(item?.idABCConfigTareaCampana ?? item?.id ?? item?.tarea?.idABCConfigTareaCampana ?? item?.tarea?.id ?? 0)
        if (!tareaId) return item
        const horarios = await apiClient.getHorariosTareaCampana(tareaId).catch(() => [])
        return {
          ...item,
          horarios
        }
      })
    )

    return normalizeTareasCampana(withHorarios)
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
      for (const horario of normalized.horarios) {
        await apiClient.postHorariosTareaCampana(tareaId, {
          horario,
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

    if (tareaId && Array.isArray(normalized.horarios) && normalized.horarios.length) {
      const existing = await apiClient.getHorariosTareaCampana(tareaId).catch(() => [])
      const existingSignatures = new Set(
        (Array.isArray(existing) ? existing : []).map(horarioSignature)
      )
      const pending = uniqueHorariosBySignature(normalized.horarios)
        .filter(h => !existingSignatures.has(horarioSignature(h)))

      for (const horario of pending) {
        await apiClient.postHorariosTareaCampana(tareaId, {
          horario,
          idUsuario: normalized.idUsuario
        })
      }
    }

    if (tareaId && normalized.horariosActivarIds.length) {
      const uniqueIds = Array.from(new Set(normalized.horariosActivarIds))
      for (const horarioId of uniqueIds) {
        await apiClient.patchActivarHorarioTareaCampana(tareaId, {
          horario: { id: horarioId },
          idUsuario: normalized.idUsuario
        })
      }
    }

    if (tareaId && normalized.horariosDesactivarIds.length) {
      const uniqueIds = Array.from(new Set(normalized.horariosDesactivarIds))
      for (const horarioId of uniqueIds) {
        await apiClient.patchDesactivarHorarioTareaCampana(tareaId, {
          horario: { id: horarioId },
          idUsuario: normalized.idUsuario
        })
      }
    }

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
