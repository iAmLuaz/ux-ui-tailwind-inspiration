import { api } from '../../api'
import type {
  TareaMonitorCampanaApiPayload,
  TareaMonitorCampanaData,
  TareaMonitorLineaApiPayload,
  TareaMonitorLineaData
} from '@/types/tareas/monitor'

interface ApiClient {
  getTareasMonitorLinea(): Promise<TareaMonitorLineaData[] | TareaMonitorLineaApiPayload[]>
  getTareasMonitorCampana(): Promise<TareaMonitorCampanaData[] | TareaMonitorCampanaApiPayload[]>
  patchActivarTareaMonitorLinea(payload: any): Promise<any>
  patchDesactivarTareaMonitorLinea(payload: any): Promise<any>
  patchActivarTareaMonitorCampana(payload: any): Promise<any>
  patchDesactivarTareaMonitorCampana(payload: any): Promise<any>
}

const apiClient = api as ApiClient

function extractArrayResponse<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  const data = (raw as { data?: unknown } | null | undefined)?.data
  return Array.isArray(data) ? (data as T[]) : []
}

function parseDateValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const raw = String(value).trim()
  if (!raw) return ''
  if (/^\d+$/.test(raw)) {
    const timestamp = Number(raw)
    if (Number.isFinite(timestamp) && timestamp > 0) {
      return new Date(timestamp).toISOString()
    }
  }
  const parsed = Date.parse(raw)
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString()
  return raw
}

function normalizeLineaRow(item: any): TareaMonitorLineaData {
  const lineaId = Number(item?.idABCCatLineaNegocio ?? item?.linea?.id ?? 0)
  const mapeoId = Number(item?.idABCConfigMapeo ?? item?.idABCConfigMapeoLinea ?? item?.mapeo?.id ?? 0)
  const actividadId = Number(item?.actividad?.id ?? 0)
  const estatusId = Number(item?.estatus?.id ?? 0)
  const ejecucionId = Number(item?.ejecucion?.id ?? 0)
  const diaId = Number(item?.dia?.id ?? 0)
  const horaId = Number(item?.hora?.id ?? 0)

  return {
    id: Number(item?.id ?? 0),
    idABCCatLineaNegocio: lineaId,
    idABCConfigMapeo: mapeoId,
    nombreMapeo: String(item?.nombreMapeo ?? item?.mapeo?.nombre ?? (mapeoId ? `Mapeo ${mapeoId}` : '')).trim(),
    bolActivo: typeof item?.bolActivo === 'boolean'
      ? item.bolActivo
      : typeof item?.activo === 'boolean'
        ? item.activo
        : Number(item?.bolActivo ?? item?.activo ?? 1) === 1,
    actividad: {
      id: actividadId || undefined,
      codigo: String(item?.actividad?.codigo ?? '').toUpperCase(),
      nombre: String(item?.actividad?.nombre ?? '').trim()
    },
    ejecucion: ejecucionId ? { id: ejecucionId } : undefined,
    dia: diaId ? { id: diaId } : undefined,
    hora: horaId ? { id: horaId } : undefined,
    estatus: {
      id: estatusId || undefined,
      codigo: String(item?.estatus?.codigo ?? '').toUpperCase(),
      nombre: String(item?.estatus?.nombre ?? '').trim()
    },
    fechaInicio: parseDateValue(item?.fechaInico ?? item?.fechaInicio),
    fechaFin: parseDateValue(item?.fechaFin),
    fechaCreacion: parseDateValue(item?.fechaCreacion),
    numeroRegistros: Number(item?.registros ?? item?.numeroRegistros ?? 0),
    numeroRegistrosProcesados: Number(item?.procesados ?? item?.numeroRegistrosProcesados ?? 0)
  }
}

function normalizeCampanaRow(item: any): TareaMonitorCampanaData {
  const diaId = Number(item?.dia?.id ?? item?.horario?.dia?.id ?? 0)
  const horaId = Number(item?.hora?.id ?? item?.horario?.dia?.hora?.id ?? 0)
  const normalized = normalizeLineaRow({
    ...item,
    dia: diaId ? { id: diaId } : item?.dia,
    hora: horaId ? { id: horaId } : item?.hora
  })
  return {
    ...normalized,
    idABCCatCampana: Number(item?.idABCCatCampana ?? item?.linea?.campana?.id ?? 0)
  }
}

export const tareaMonitorService = {
  async getLinea() {
    const raw = await apiClient.getTareasMonitorLinea()
    return extractArrayResponse<any>(raw).map(normalizeLineaRow)
  },

  async getCampana() {
    const raw = await apiClient.getTareasMonitorCampana()
    return extractArrayResponse<any>(raw).map(normalizeCampanaRow)
  },

  async patchDictaminarLinea(id: number, bolActivo: boolean, idUsuario = 1) {
    const payload = { tarea: { id, idUsuario } }
    const raw = bolActivo
      ? await apiClient.patchActivarTareaMonitorLinea(payload)
      : await apiClient.patchDesactivarTareaMonitorLinea(payload)
    return normalizeLineaRow(raw)
  },

  async patchDictaminarCampana(id: number, bolActivo: boolean, idUsuario = 1) {
    const payload = { tarea: { id, idUsuario } }
    const raw = bolActivo
      ? await apiClient.patchActivarTareaMonitorCampana(payload)
      : await apiClient.patchDesactivarTareaMonitorCampana(payload)
    return normalizeCampanaRow(raw)
  }
}
