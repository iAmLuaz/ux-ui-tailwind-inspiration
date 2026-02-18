import { api } from '../../api'
import type { TareaLineaData } from '@/types/tareas/linea'
import { normalizeTareasLinea } from '@/adapters/tareas/linea/tareaLinea.adapter'

interface ApiClient {
  getTareasLinea(): Promise<TareaLineaData[]>
  getTareasLineaByLinea(lineaId: string | number): Promise<TareaLineaData[]>
  createTareaLinea(lineaId: string | number, payload: any): Promise<TareaLineaData>
  getHorariosTareaLinea(tareaId: string | number): Promise<any[]>
  postHorariosTareaLinea(tareaId: string | number, payload: any): Promise<any>
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

export const tareaLineaService = {
  getAll() {
    return apiClient.getTareasLinea().then(normalizeTareasLinea)
  },

  getByLinea(lineaId: string | number) {
    return apiClient.getTareasLineaByLinea(lineaId).then(normalizeTareasLinea)
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
      for (const horario of normalized.horarios) {
        await apiClient.postHorariosTareaLinea(tareaId, {
          horario,
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

    if (tareaId && Array.isArray(normalized.horarios) && normalized.horarios.length) {
      const existing = await apiClient.getHorariosTareaLinea(tareaId).catch(() => [])
      const existingSignatures = new Set(
        (Array.isArray(existing) ? existing : []).map(horarioSignature)
      )
      const pending = uniqueHorariosBySignature(normalized.horarios)
        .filter(h => !existingSignatures.has(horarioSignature(h)))

      for (const horario of pending) {
        await apiClient.postHorariosTareaLinea(tareaId, {
          horario,
          idUsuario: normalized.idUsuario
        })
      }
    }

    if (tareaId && normalized.horariosActivarIds.length) {
      const uniqueIds = Array.from(new Set(normalized.horariosActivarIds))
      for (const horarioId of uniqueIds) {
        await apiClient.patchActivarHorarioTareaLinea(tareaId, {
          horario: { id: horarioId },
          idUsuario: normalized.idUsuario
        })
      }
    }

    if (tareaId && normalized.horariosDesactivarIds.length) {
      const uniqueIds = Array.from(new Set(normalized.horariosDesactivarIds))
      for (const horarioId of uniqueIds) {
        await apiClient.patchDesactivarHorarioTareaLinea(tareaId, {
          horario: { id: horarioId },
          idUsuario: normalized.idUsuario
        })
      }
    }

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
