import type { MapeoData, MapeoCampanaData } from '../types/mapeo'
import type {
  ColumnaData,
  ColumnaCampanaData,
  CreateColumnaLineaPayload,
  UpdateColumnaLineaPayload,
  PatchColumnaLineaPayload,
  UpdateColumnaCampanaPayload,
  PatchColumnaCampanaPayload
} from '../types/columna'
import type { CatalogoCodigo, CatalogoItem } from '../types/catalogos'

export function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function logRequest(method: string, endpoint: string, payload?: any) {
  console.log(`[${method}] ${endpoint}`)
  if (payload) {
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2))
  }
}

const mockCatalogos: Record<CatalogoCodigo, CatalogoItem[]> = {
  ROL: [
    {
      id: 1,
      bolActivo: true,
      codigo: 'ABC_CAT_ROL',
      nombre: 'Administrador',
      fecCreacion: '2026-01-01T00:00:00Z',
      fecUltModificacion: '2026-01-10T00:00:00Z'
    }
  ],
  LNN: [
    {
      id: 1,
      bolActivo: true,
      codigo: 'ABC_CAT_LINEA_NEGOCIO',
      nombre: 'Afore',
      fecCreacion: '2026-01-01T00:00:00Z',
      fecUltModificacion: '2026-01-10T00:00:00Z'
    }
  ],
  CMP: [
    {
      id: 1,
      bolActivo: true,
      codigo: 'ABC_CAT_CAMPANA',
      nombre: 'Campaña 1',
      fecCreacion: '2026-01-01T00:00:00Z',
      fecUltModificacion: '2026-01-10T00:00:00Z'
    }
  ],
  CLM: [
    {
      id: 1,
      bolActivo: true,
      codigo: 'ABC_CAT_COLUMNA',
      nombre: 'Columna 1',
      fecCreacion: '2026-01-01T00:00:00Z',
      fecUltModificacion: '2026-01-10T00:00:00Z'
    }
  ]
}

export const mockCatalogosApi = {
  async getCatalogos(codigo: CatalogoCodigo | string): Promise<CatalogoItem[]> {
    await delay()
    logRequest('GET', `/catalogos?codigo=${codigo}`)
    const key = (String(codigo).toUpperCase() as CatalogoCodigo)
    return mockCatalogos[key] ?? []
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
    const mapeoIdFromPayload = payload?.mapeo?.id ?? payload?.mapeo?.idABCConfigMapeoLinea ?? payload?.mapeo?.idABCConfigMapeoCampana
    const endpoint = mapeoIdFromPayload ? `/lineas/campanas/mapeos/${mapeoIdFromPayload}` : '/lineas/campanas/mapeos'
    logRequest('PUT', endpoint, payload)

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
    idABCConfigMapeoCampana: 101,
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
    idABCConfigMapeoCampana: 102,
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

  async getColumnasCampanaByMapeo(
    mapeoId: string | number
  ): Promise<ColumnaCampanaData[]> {
    await delay()
    logRequest('GET', `/campanas/mapeos/${mapeoId}/columnas`)
    return mockColumnasCampana.filter(
      c => c.idABCConfigMapeoCampana === Number(mapeoId)
    )
  },

  async createColumnaCampanaGlobal(payload: any): Promise<any> {
    await delay()
    logRequest('POST', '/campanas/mapeos/0/columnas', payload)

    const nextId = (mockColumnasCampana.length
      ? Math.max(...mockColumnasCampana.map(c => c.idABCConfigMapeoCampana)) + 1
      : 201)

    const item: ColumnaCampanaData = {
      idABCConfigMapeoCampana: Number(payload.idABCConfigMapeoCampana ?? nextId),
      idABCCatCampana: Number(payload.idABCCatCampana ?? 1),
      bolActivo: payload.bolActivo ?? true,
      idABCCatColumna: Number(payload.idABCCatColumna ?? payload.idABCCatColumna ?? 1),
      bolCarga: payload.bolCarga ?? false,
      bolValidacion: payload.bolValidacion ?? false,
      bolEnvio: payload.bolEnvio ?? false,
      regex: payload.regex ?? '',
      fecCreacion: new Date().toISOString(),
      idABCUsuarioUltModificacion: payload.idUsuario ?? payload.idABCUsuarioUltModificacion ?? 1,
      fecUltModificacion: new Date().toISOString()
    }

    mockColumnasCampana.push(item)
    return item
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
    const list = mockColumnasByMapeo[Number(payload.idABCConfigMapeoLinea)]
    const item = list?.find(c => c.idABCCatColumna === payload.idABCCatColumna)
    if (item) {
      item.bolActivo = true
      item.idABCUsuarioUltModificacion = payload.idUsuario
      item.fecUltModificacion = new Date().toISOString()
      return item
    }
    return payload
  },

  async patchDesactivarColumnaLinea(payload: PatchColumnaLineaPayload): Promise<any> {
    await delay()
    logRequest('PATCH', '/lineas/mapeos/columnas/desactivar', payload)
    const list = mockColumnasByMapeo[Number(payload.idABCConfigMapeoLinea)]
    const item = list?.find(c => c.idABCCatColumna === payload.idABCCatColumna)
    if (item) {
      item.bolActivo = false
      item.idABCUsuarioUltModificacion = payload.idUsuario
      item.fecUltModificacion = new Date().toISOString()
      return item
    }
    return payload
  },

  async createColumnaCampana(
    mapeoId: string | number,
    payload: CreateColumnaLineaPayload
  ): Promise<any> {
    await delay()
    logRequest('POST', `/campanas/mapeos/${mapeoId}/columnas`, payload)
    return {
      idABCConfigMapeoCampana: Number(mapeoId),
      idABCCatCampana: 1,
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

  async updateColumnaCampana(payload: UpdateColumnaCampanaPayload): Promise<any> {
    await delay()
    logRequest('PUT', '/campanas/mapeos/columnas', payload)
    return payload
  },

  async patchActivarColumnaCampana(payload: PatchColumnaCampanaPayload): Promise<any> {
    await delay()
    logRequest('PATCH', '/campanas/mapeos/columnas/activar', payload)
    const item = mockColumnasCampana.find(
      c => c.idABCConfigMapeoCampana === payload.idABCConfigMapeoCampana && c.idABCCatColumna === payload.idABCCatColumna
    )
    if (item) {
      item.bolActivo = true
      item.idABCUsuarioUltModificacion = payload.idUsuario
      item.fecUltModificacion = new Date().toISOString()
      return item
    }
    return payload
  },

  async patchDesactivarColumnaCampana(payload: PatchColumnaCampanaPayload): Promise<any> {
    await delay()
    logRequest('PATCH', '/campanas/mapeos/columnas/desactivar', payload)
    const item = mockColumnasCampana.find(
      c => c.idABCConfigMapeoCampana === payload.idABCConfigMapeoCampana && c.idABCCatColumna === payload.idABCCatColumna
    )
    if (item) {
      item.bolActivo = false
      item.idABCUsuarioUltModificacion = payload.idUsuario
      item.fecUltModificacion = new Date().toISOString()
      return item
    }
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