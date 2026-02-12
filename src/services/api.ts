import type {
  CreateColumnaLineaPayload,
  PatchColumnaLineaPayload,
  UpdateColumnaLineaPayload,
  PatchColumnaCampanaPayload,
  UpdateColumnaCampanaPayload,
  CreateColumnaCampanaPayload
} from '../types/columnas/columna'
import type { BitacoraPayload } from '../types/bitacora'
import { addToast } from '@/stores/toastStore'

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.VITE_USE_MOCK === 'true'
    ? 'http://localhost:3100/api'
    : 'http://localhost:3000/api')
const _shownLoadedToasts = new Set<string>()

function getBrowserInfo() {
  if (typeof navigator === 'undefined') {
    return { name: 'unknown', version: 'unknown', ua: 'unknown' }
  }

  const ua = navigator.userAgent
  const edge = /Edg\/([\d.]+)/.exec(ua)
  const chrome = /Chrome\/([\d.]+)/.exec(ua)
  const firefox = /Firefox\/([\d.]+)/.exec(ua)
  const safari = /Version\/([\d.]+).*Safari/.exec(ua)

  if (edge) return { name: 'Edge', version: edge[1], ua }
  if (chrome) return { name: 'Chrome', version: chrome[1], ua }
  if (firefox) return { name: 'Firefox', version: firefox[1], ua }
  if (safari) return { name: 'Safari', version: safari[1], ua }

  return { name: 'unknown', version: 'unknown', ua }
}

async function getClientIp(): Promise<string> {
  // try {
  //   const res = await fetch('https://api.ipify.org?format=json')
  //   if (!res.ok) return '0.0.0.0'
  //   const data = await res.json()
  //   return String(data?.ip ?? '0.0.0.0')
  // } catch {
    return '0.0.0.0'
  // }
}

async function getClientMac(): Promise<string> {
  return 'No permitido'
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers
  }

  const endpointLower = String(endpoint || '').toLowerCase()
  const isBitacoraEndpoint = endpointLower.includes('/bitacoras/eventos') || endpointLower.includes('/bitacoras')
  const suppressToast = ((): boolean => {
    const raw = (headers as any)['X-Suppress-Toast'] ?? (headers as any)['x-suppress-toast']
    return String(raw ?? '').toLowerCase() === 'true' || isBitacoraEndpoint
  })()

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers
    })
  } catch (err) {
    if (!suppressToast) addToast('Error de red: no se pudo conectar al servidor', 'error')
    throw err
  }

  const status = response.status
  const method = (options.method || 'GET').toUpperCase()

  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined

    if (response.ok) {
      const path = endpointLower
    if (method === 'GET') {
      if (!suppressToast && (path.includes('/mapeos') || path.includes('/columnas'))) {
        if (!_shownLoadedToasts.has(path)) {
          addToast('Datos cargados correctamente', 'info')
          _shownLoadedToasts.add(path)
        }
      }
    } else if (method === 'POST') {
      if (!suppressToast && !isBitacoraEndpoint) addToast('Recurso creado correctamente', 'success')
    } else if (method === 'PUT' || method === 'PATCH') {
      if (!suppressToast && !isBitacoraEndpoint) addToast('Recurso actualizado correctamente', 'success')
    } else if (method === 'DELETE') {
      if (!suppressToast && !isBitacoraEndpoint) addToast('Recurso eliminado correctamente', 'success')
    }

    return data as T
  }

  let message = `Error ${status}`
  switch (status) {
    case 400:
      message = 'Solicitud inválida (400)'
      break
    case 401:
      message = 'No autorizado (401)'
      break
    case 403:
      message = 'Prohibido (403)'
      break
    case 404:
      message = 'No encontrado (404)'
      break
    case 429:
      message = 'Demasiadas solicitudes (429). Intenta más tarde.'
      break
    case 500:
      message = 'Error interno del servidor (500)'
      break
    default:
      message = data && data.message ? String(data.message) : `${status} ${response.statusText}`
  }

  if (!((options.headers as any)?.['X-Suppress-Toast'] === 'true' || (options.headers as any)?.['x-suppress-toast'] === 'true' || suppressToast)) {
    addToast(message, 'error')
  }
  const err = new Error(message)
  ;(err as any).status = status
  ;(err as any).response = response
  throw err
}


export const http = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  put: <T>(endpoint: string, data: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  patch: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: 'DELETE'
    })
}

export const api = {
  // Catálogos
  getCatalogos: (codigo: string) => http.get(`/catalogos/${encodeURIComponent(String(codigo))}`),

  // Mapeo línea
  getAllMapeos: () => http.get('/lineas/mapeos'),
  getMapeosByLinea: (lineaId: string | number) =>
    http.get(`/lineas/${lineaId}/mapeos`),
  createMapeoLinea: (lineaId: string | number, payload: any) =>
    http.post(`/lineas/${lineaId}/mapeos`, payload),
  updateMapeoLinea: (payload: any) => http.put('/lineas/mapeos', payload),
  deleteMapeoLinea: (lineaId: string | number, mapeoId: string | number) =>
    http.delete(`/lineas/${lineaId}/mapeos/${mapeoId}`),
  patchActivarMapeoLinea: (payload: any) =>
    http.patch('/lineas/mapeos/activar', payload),
  patchDesactivarMapeoLinea: (payload: any) =>
    http.patch('/lineas/mapeos/desactivar', payload),

  // Mapeo campaña
  getMapeosCampana: () => http.get('/lineas/campanas/mapeos'),
  createMapeoCampana: (
    lineaId: string | number,
    campanaId: string | number,
    payload: any
  ) => http.post(`/lineas/${lineaId}/campanas/${campanaId}/mapeos`, payload),
  updateMapeoCampana: (payload: any) => {
    const mapeoId = payload?.mapeo?.id ?? payload?.mapeo?.idABCConfigMapeoLinea ?? payload?.mapeo?.idABCConfigMapeoCampana
    const endpoint = mapeoId
      ? `/lineas/campanas/mapeos`
      : '/lineas/campanas/mapeos'
    return http.put(endpoint, payload)
  },
  
  patchActivarMapeoCampana: (payload: any) =>
    http.patch('/lineas/campanas/mapeos/activar', payload),
  patchDesactivarMapeoCampana: (payload: any) =>
    http.patch('/lineas/campanas/mapeos/desactivar', payload),

  // Tareas linea
  getTareasLinea: () => http.get('/lineas/tareas'),
  getTareasLineaByLinea: (lineaId: string | number) =>
    http.get(`/lineas/${lineaId}/tareas`),
  createTareaLinea: (lineaId: string | number, payload: any) =>
    http.post(`/lineas/${lineaId}/tareas`, payload),
  updateTareaLinea: (payload: any) => http.put('/lineas/tareas', payload),
  deleteTareaLinea: (lineaId: string | number, tareaId: string | number) =>
    http.delete(`/lineas/${lineaId}/tareas/${tareaId}`),
  patchActivarTareaLinea: (payload: any) =>
    http.patch('/lineas/tareas/activar', payload),
  patchDesactivarTareaLinea: (payload: any) =>
    http.patch('/lineas/tareas/desactivar', payload),

  // Tareas campana
  getTareasCampana: () => http.get('/lineas/campanas/tareas'),
  getTareasCampanaByLineaCampana: (lineaId: string | number, campanaId: string | number) =>
    http.get(`/lineas/${lineaId}/campanas/${campanaId}/tareas`),
  createTareaCampana: (lineaId: string | number, campanaId: string | number, payload: any) =>
    http.post(`/lineas/${lineaId}/campanas/${campanaId}/tareas`, payload),
  updateTareaCampana: (payload: any) => http.put('/lineas/campanas/tareas', payload),
  deleteTareaCampana: (lineaId: string | number, campanaId: string | number, tareaId: string | number) =>
    http.delete(`/lineas/${lineaId}/campanas/${campanaId}/tareas/${tareaId}`),
  patchActivarTareaCampana: (payload: any) =>
    http.patch('/lineas/campanas/tareas/activar', payload),
  patchDesactivarTareaCampana: (payload: any) =>
    http.patch('/lineas/campanas/tareas/desactivar', payload),

  // Columna mapeo (línea)
  getColumnasLinea: () => http.get('/lineas/mapeos/0/columnas'),
  getColumnasByMapeo: (mapeoId: string | number) =>
    http.get(`/lineas/mapeos/${mapeoId}/columnas`),
  createColumnaLinea: (
    mapeoId: string | number,
    payload: CreateColumnaLineaPayload
  ) => http.post(`/lineas/mapeos/${mapeoId}/columnas`, payload),
  updateColumnaLinea: (mapeoId: string | number | undefined, payload: UpdateColumnaLineaPayload) => {
    const endpoint = mapeoId ? `/lineas/mapeos/${mapeoId}/columnas` : '/lineas/mapeos/columnas'
    return http.put(endpoint, payload)
  },
  patchActivarColumnaLinea: (mapeoId: string | number, payload: PatchColumnaLineaPayload) =>
    http.patch(`/lineas/mapeos/${mapeoId}/columnas/activar`, payload),
  patchDesactivarColumnaLinea: (mapeoId: string | number, payload: PatchColumnaLineaPayload) =>
    http.patch(`/lineas/mapeos/${mapeoId}/columnas/desactivar`, payload),

  // Columna mapeo (campaña)
  getColumnasCampana: () => http.get('/campanas/mapeos/0/columnas'),
  getColumnasCampanaByMapeo: (mapeoId: string | number) =>
    http.get(`/campanas/mapeos/${mapeoId}/columnas`),
  createColumnaCampanaGlobal: (payload: any) => http.post('/campanas/mapeos/0/columnas', payload),
  createColumnaCampana: (
    mapeoId: string | number,
    payload: CreateColumnaCampanaPayload
  ) => http.post(`/campanas/mapeos/${mapeoId}/columnas`, payload),
  updateColumnaCampana: (mapeoId: string | number | undefined, payload: UpdateColumnaCampanaPayload) => {
    const endpoint = mapeoId ? `/campanas/mapeos/${mapeoId}/columnas` : '/campanas/mapeos/columnas'
    return http.put(endpoint, payload)
  },
  patchActivarColumnaCampana: (mapeoId: string | number, payload: PatchColumnaCampanaPayload) =>
    http.patch(`/campanas/mapeos/${mapeoId}/columnas/activar`, payload),
  patchDesactivarColumnaCampana: (mapeoId: string | number, payload: PatchColumnaCampanaPayload) =>
    http.patch(`/campanas/mapeos/${mapeoId}/columnas/desactivar`, payload)

  ,
  // Bitácoras de usuarios
  postBitacoraUsuario: (payload: BitacoraPayload) => http.post('/bitacoras/eventos', payload),
  postBitacoraByContext: async (
    method: 'POST' | 'PUT' | 'PATCH' | string,
    endpoint: string,
    resourcePayload: any = {},
    detalle?: string,
    idUsuario: number = 1,
    ip: string = '192.178.14.14',
    navegador: string = 'chrome'
  ) => {
    // void idUsuario
    void resourcePayload
    const evento = method === 'POST' ? 3 : method === 'PUT' || method === 'PATCH' ? 4 : 0

    let objeto = 2 
    if (String(endpoint).includes('/columnas')) objeto = 4 

    const browserInfo = getBrowserInfo()
    const mac = await getClientMac()
    const resolvedIp = ip || (await getClientIp())
    const resolvedNavegador = navegador || browserInfo.name
    const resolvedDetalle = detalle ?? `${browserInfo.ua}, ${browserInfo.name}, ${browserInfo.version}, ${mac}`

    const payload: BitacoraPayload = {
      idUsuario: idUsuario,
      bitacora: {
        evento: { id: evento },
        objeto: { id: objeto },
        detalle: resolvedDetalle,
        ip: resolvedIp,
        navegador: resolvedNavegador
      }
    }

    return request<any>('/bitacoras/eventos', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'X-Suppress-Toast': 'true' }
    })
  }
}