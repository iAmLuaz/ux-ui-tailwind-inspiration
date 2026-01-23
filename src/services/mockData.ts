import type { MapeoData, MapeoCampanaData } from '../types/mapeo'
import type {
  ColumnaData,
  ColumnaCampanaData,
  CreateColumnaLineaPayload,
  UpdateColumnaLineaPayload,
  PatchColumnaLineaPayload
} from '../types/columna'

export function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function logRequest(method: string, endpoint: string, payload?: any) {
  console.log(`[${method}] ${endpoint}`)
  if (payload) {
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2))
  }
}

const mockMapeosLineas: Record<number, MapeoData[]> = {
  1: [
    {
      idABCConfigMapeoLinea: 1,
      idABCCatLineaNegocio: 1,
      idABCUsuario: 1,
      nombre: 'Mapeo Seguro 1',
      descripcion: 'Mapeo principal de Seguro 1',
      bolActivo: true,
      bolDictaminacion: null,
      fecCreacion: '2026-01-01T00:00:00Z',
      idABCUsuarioUltModificacion: 1,
      fecUltModificacion: '2026-01-01T00:00:00Z'
    }
  ],
  2: [
    {
      idABCConfigMapeoLinea: 2,
      idABCCatLineaNegocio: 2,
      idABCUsuario: 1,
      nombre: 'Mapeo Seguro 2',
      descripcion: 'Mapeo principal de Seguro 2',
      bolActivo: true,
      bolDictaminacion: null,
      fecCreacion: '2026-01-01T00:00:00Z',
      idABCUsuarioUltModificacion: 1,
      fecUltModificacion: '2026-01-01T00:00:00Z'
    }
  ],
  3: [
    {
      idABCConfigMapeoLinea: 3,
      idABCCatLineaNegocio: 3,
      idABCUsuario: 1,
      nombre: 'Mapeo Seguro 3',
      descripcion: 'Mapeo principal de Seguro 3',
      bolActivo: true,
      bolDictaminacion: null,
      fecCreacion: '2026-01-01T00:00:00Z',
      idABCUsuarioUltModificacion: 1,
      fecUltModificacion: '2026-01-01T00:00:00Z'
    }
  ]
}

let mapeoIdCounter = 3

export const mockApi = {
  async getAllMapeos(): Promise<MapeoData[]> {
    await delay()
    logRequest('GET', '/lineas/0/mapeos')
    return Object.values(mockMapeosLineas).flat()
  },

  async getMapeosByLinea(lineaId: string | number): Promise<MapeoData[]> {
    await delay()
    logRequest('GET', `/lineas/${lineaId}/mapeos`)
    return mockMapeosLineas[Number(lineaId)] ?? []
  },

  async getMapeosCampana(): Promise<MapeoCampanaData[]> {
    await delay()
    logRequest('GET', '/lineas/0/campana/0/mapeos', { mapeo: { id: null } })
    return mockMapeosCampanas
  },

  async createMapeoLinea(
    lineaId: string | number,
    payload: any
  ): Promise<MapeoData> {
    await delay()
    logRequest('POST', `/lineas/${lineaId}/mapeos`, payload)

    const m: MapeoData = {
      idABCConfigMapeoLinea: mapeoIdCounter++,
      idABCCatLineaNegocio: Number(lineaId),
      idABCUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      nombre: payload.mapeo.nombre,
      descripcion: payload.mapeo.descripcion,
      bolActivo: true,
      bolDictaminacion: null,
      fecCreacion: new Date().toISOString(),
      idABCUsuarioUltModificacion: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      fecUltModificacion: new Date().toISOString()
    }

    const lineaKey = Number(lineaId)
    mockMapeosLineas[lineaKey] ??= []
    mockMapeosLineas[lineaKey].push(m)

    return m
  },

  async createMapeoCampana(
    lineaId: string | number,
    campanaId: string | number,
    payload: any
  ): Promise<MapeoCampanaData> {
    await delay()
    logRequest('POST', `/lineas/${lineaId}/campana/${campanaId}/mapeos`, payload)

    const m: MapeoCampanaData = {
      idABCConfigMapeoLinea: mapeoIdCounter++,
      idABCCatLineaNegocio: Number(lineaId),
      idABCCatCampana: Number(campanaId),
      idABCUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      nombre: payload.mapeo.nombre,
      descripcion: payload.mapeo.descripcion,
      bolActivo: true,
      bolDictaminacion: null,
      fecCreacion: new Date().toISOString(),
      idABCUsuarioUltModificacion: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      fecUltModificacion: new Date().toISOString()
    }

    mockMapeosCampanas.push(m)
    return m
  },

  async updateMapeoLinea(payload: any): Promise<MapeoData> {
    await delay()
    logRequest('PUT', '/lineas/mapeos', payload)

    const data = payload.mapeo ?? payload.mapeos ?? {}
    const { idABCConfigMapeoLinea, idABCCatLineaNegocio, id, id_linea, nombre, descripcion } = data
    const mapeoId = Number(idABCConfigMapeoLinea ?? id)

    let targetList: MapeoData[] | undefined
    if (idABCCatLineaNegocio ?? id_linea) {
      const lineaKey = Number(idABCCatLineaNegocio ?? id_linea)
      targetList = mockMapeosLineas[lineaKey]
      if (!targetList) throw new Error('Línea no encontrada')
    } else {
      for (const list of Object.values(mockMapeosLineas)) {
        const found = list.find(x => x.idABCConfigMapeoLinea === mapeoId)
        if (found) {
          targetList = list
          break
        }
      }
    }

    if (!targetList) throw new Error('Línea no encontrada')
    const m = targetList.find(x => x.idABCConfigMapeoLinea === mapeoId)
    if (!m) throw new Error('Mapeo no encontrado')

    m.nombre = nombre ?? m.nombre
    m.descripcion = descripcion ?? m.descripcion
    m.idABCUsuarioUltModificacion = payload.idUsuario ?? payload.idABCUsuario ?? 1
    m.fecUltModificacion = new Date().toISOString()

    return m
  },

  async updateMapeoCampana(payload: any): Promise<MapeoCampanaData> {
    await delay()
    logRequest('PUT', '/lineas/campanas/mapeos', payload)

    const data = payload.mapeo ?? payload.mapeos ?? {}
    const { idABCConfigMapeoLinea, id, nombre, descripcion } = data
    const mapeoId = Number(idABCConfigMapeoLinea ?? id)

    const m = mockMapeosCampanas.find(x => x.idABCConfigMapeoLinea === mapeoId)
    if (!m) throw new Error('Mapeo no encontrado')

    m.nombre = nombre ?? m.nombre
    m.descripcion = descripcion ?? m.descripcion
    m.idABCUsuarioUltModificacion = payload.idUsuario ?? payload.idABCUsuario ?? 1
    m.fecUltModificacion = new Date().toISOString()

    return m
  },

  async deleteMapeoLinea(
    lineaId: string | number,
    mapeoId: string | number
  ): Promise<void> {
    await delay()
    logRequest('DELETE', `/lineas/${lineaId}/mapeos/${mapeoId}`)

    const key = Number(lineaId)
    if (mockMapeosLineas[key]) {
      mockMapeosLineas[key] = mockMapeosLineas[key].filter(
        m => m.idABCConfigMapeoLinea !== Number(mapeoId)
      )
    }
  },

  async patchActivarMapeoLinea(payload: any): Promise<MapeoData> {
    await delay()
    logRequest('PATCH', '/lineas/mapeos/activar', payload)

    const id = payload.mapeo.id

    for (const list of Object.values(mockMapeosLineas)) {
      const m = list.find(x => x.idABCConfigMapeoLinea === id)
      if (m) {
        m.bolActivo = !m.bolActivo
        return m
      }
    }

    throw new Error('Mapeo no encontrado')
  },

  async patchDesactivarMapeoLinea(payload: any): Promise<MapeoData> {
    await delay()
    logRequest('PATCH', '/lineas/mapeos/desactivar', payload)

    const id = payload.mapeo.id

    for (const list of Object.values(mockMapeosLineas)) {
      const m = list.find(x => x.idABCConfigMapeoLinea === id)
      if (m) {
        m.bolActivo = false
        return m
      }
    }

    throw new Error('Mapeo no encontrado')
  },

  async patchActivarMapeoCampana(payload: any): Promise<MapeoCampanaData> {
    await delay()
    logRequest('PATCH', '/lineas/campanas/mapeos/activar', payload)

    const id = payload.mapeo.id
    const m = mockMapeosCampanas.find(x => x.idABCConfigMapeoLinea === id)
    if (!m) throw new Error('Mapeo no encontrado')

    m.bolActivo = !m.bolActivo
    return m
  },

  async patchDesactivarMapeoCampana(payload: any): Promise<MapeoCampanaData> {
    await delay()
    logRequest('PATCH', '/lineas/campanas/mapeos/desactivar', payload)

    const id = payload.mapeo.id
    const m = mockMapeosCampanas.find(x => x.idABCConfigMapeoLinea === id)
    if (!m) throw new Error('Mapeo no encontrado')

    m.bolActivo = false
    return m
  },

  
}

const mockColumnasByMapeo: Record<number, ColumnaData[]> = {
  1: [
    {
      idABCConfigMapeoLinea: 1,
      bolActivo: true,
      idABCCatColumna: 1,
      bolCarga: true,
      bolValidacion: false,
      bolEnvio: true,
      regex: '^[A-Z]+$\n',
      fecCreacion: '2026-01-01T00:00:00Z',
      idABCUsuarioUltModificacion: 1,
      fecUltModificacion: '2026-01-01T00:00:00Z'
    },
    {
      idABCConfigMapeoLinea: 1,
      bolActivo: false,
      idABCCatColumna: 2,
      bolCarga: true,
      bolValidacion: true,
      bolEnvio: false,
      regex: '^[0-9]+$\n',
      fecCreacion: '2026-01-02T00:00:00Z',
      idABCUsuarioUltModificacion: 1,
      fecUltModificacion: '2026-01-02T00:00:00Z'
    }
  ]
}

const mockColumnasCampana: ColumnaCampanaData[] = [
  {
    idABCConfigMapeoLinea: 101,
    idABCCatCampana: 1,
    bolActivo: true,
    idABCCatColumna: 1,
    bolCarga: true,
    bolValidacion: false,
    bolEnvio: true,
    regex: '^[A-Z]+$',
    fecCreacion: '2026-01-03T00:00:00Z',
    idABCUsuarioUltModificacion: 1,
    fecUltModificacion: '2026-01-03T00:00:00Z'
  },
  {
    idABCConfigMapeoLinea: 102,
    idABCCatCampana: 2,
    bolActivo: false,
    idABCCatColumna: 2,
    bolCarga: false,
    bolValidacion: true,
    bolEnvio: false,
    regex: '^[0-9]+$',
    fecCreacion: '2026-01-04T00:00:00Z',
    idABCUsuarioUltModificacion: 1,
    fecUltModificacion: '2026-01-04T00:00:00Z'
  }
]

export const mockColumnasApi = {
  async getColumnasByMapeo(mapeoId: string | number): Promise<ColumnaData[]> {
    await delay()
    logRequest('GET', `/lineas/mapeos/${mapeoId}/columnas`)
    return mockColumnasByMapeo[Number(mapeoId)] ?? []
  },

  async getColumnasCampana(): Promise<ColumnaCampanaData[]> {
    await delay()
    logRequest('GET', '/campanas/mapeos/0/columnas')
    return mockColumnasCampana
  },

  async createColumnaLinea(
    mapeoId: string | number,
    payload: CreateColumnaLineaPayload
  ): Promise<any> {
    await delay()
    logRequest('POST', `/lineas/mapeos/${mapeoId}/columnas`, payload)
    return {
      idABCConfigMapeoLinea: Number(mapeoId),
      idABCCatColumna: payload.idABCCatColumna,
      bolActivo: true,
      bolCarga: true,
      bolValidacion: false,
      bolEnvio: false,
      regex: payload.regex,
      fecCreacion: new Date().toISOString(),
      idABCUsuarioUltModificacion: payload.idUsuario,
      fecUltModificacion: new Date().toISOString()
    }
  },

  async updateColumnaLinea(payload: UpdateColumnaLineaPayload): Promise<any> {
    await delay()
    logRequest('PUT', '/lineas/mapeos/columnas', payload)
    return payload
  },

  async patchActivarColumnaLinea(payload: PatchColumnaLineaPayload): Promise<any> {
    await delay()
    logRequest('PATCH', '/lineas/mapeos/columnas/activar', payload)
    return payload
  },

  async patchDesactivarColumnaLinea(payload: PatchColumnaLineaPayload): Promise<any> {
    await delay()
    logRequest('PATCH', '/lineas/mapeos/columnas/desactivar', payload)
    return payload
  }
}

const mockMapeosCampanas: MapeoCampanaData[] = [
  {
    idABCConfigMapeoLinea: 101,
    idABCCatLineaNegocio: 1,
    idABCCatCampana: 1,
    idABCUsuario: 1,
    nombre: 'Mapeo Campaña 1-1',
    descripcion: 'Mapeo de campaña para línea 1',
    bolActivo: true,
    bolDictaminacion: null,
    fecCreacion: '2026-01-01T00:00:00Z',
    idABCUsuarioUltModificacion: 1,
    fecUltModificacion: '2026-01-01T00:00:00Z'
  },
  {
    idABCConfigMapeoLinea: 102,
    idABCCatLineaNegocio: 2,
    idABCCatCampana: 2,
    idABCUsuario: 1,
    nombre: 'Mapeo Campaña 2-2',
    descripcion: 'Mapeo de campaña para línea 2',
    bolActivo: false,
    bolDictaminacion: null,
    fecCreacion: '2026-01-02T00:00:00Z',
    idABCUsuarioUltModificacion: 1,
    fecUltModificacion: '2026-01-02T00:00:00Z'
  }
]