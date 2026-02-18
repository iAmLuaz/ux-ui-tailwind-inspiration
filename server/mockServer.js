import http from 'http'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 3100
const API_PREFIX = '/api'

const now = () => new Date().toISOString()

async function readJson(relPath) {
  const filePath = path.join(__dirname, relPath)
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

const store = {
  catalogos: [],
  mapeosLinea: [],
  mapeosCampana: [],
  columnasLinea: [],
  columnasCampana: [],
  tareasLinea: [],
  tareasCampana: [],
  horariosTareaLinea: [],
  horariosTareaCampana: []
}

const CATALOGOS_META = {
  CDN: 'CADENA',
  CMP: 'CAMPANA',
  CLM: 'COLUMNA',
  ROL: 'ROL',
  NMR: 'NUMERO',
  VAL: 'VALOR',
  LNN: 'LINEA_NEGOCIO'
}

function normalizeCatalogText(value) {
  const clean = String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.replace(/\bCOSTUMER\b/gi, 'CUSTOMER')
}

function normalizeCatalogItem(item) {
  return {
    id: Number(item?.id ?? item?.idCatalogo ?? 0),
    bolActivo: typeof item?.bolActivo === 'boolean' ? item.bolActivo : Number(item?.bolActivo ?? 1) === 1,
    codigo: normalizeCatalogText(item?.codigo),
    nombre: normalizeCatalogText(item?.nombre),
    fecCreacion: item?.fecCreacion ?? item?.fechaCreacion ?? now(),
    fecUltModificacion: item?.fecUltModificacion ?? item?.fechaUltimaModificacion ?? now()
  }
}

async function loadCatalogos() {
  const base = 'api/catalogos'
  const codes = Object.keys(CATALOGOS_META)
  const grouped = []
  for (const code of codes) {
    try {
      const raw = await readJson(`${base}/${code}.json`)
      let registros = Array.isArray(raw) ? raw : []
      if (registros.length === 1 && Array.isArray(registros[0])) {
        registros = registros[0]
      }
      grouped.push({
        codigo: code,
        nombre: CATALOGOS_META[code],
        registros: (registros || []).map(normalizeCatalogItem)
      })
    } catch {
      grouped.push({
        codigo: code,
        nombre: CATALOGOS_META[code],
        registros: []
      })
    }
  }
  store.catalogos = grouped
}

async function loadData() {
  const tareasLineaRaw = await readJson('api/tareas/linea.json')
  const tareasCampanaRaw = await readJson('api/tareas/campana.json')
  const horariosLineaRaw = await readJson('api/tareas/horarios-linea.json')
  const horariosCampanaRaw = await readJson('api/tareas/horarios-campana.json')
  const mapeosLineaRaw = await readJson('api/mapeos/linea.json')
  const mapeosCampanaRaw = await readJson('api/mapeos/campana.json')
  const columnasLineaRaw = await readJson('api/columnas/linea.json')
  const columnasCampanaRaw = await readJson('api/columnas/campana.json')

  store.mapeosLinea = (Array.isArray(mapeosLineaRaw) ? mapeosLineaRaw : []).map(item =>
    normalizeMapeoLineaRecord(item)
  )
  store.mapeosCampana = (Array.isArray(mapeosCampanaRaw) ? mapeosCampanaRaw : []).map(item =>
    normalizeMapeoCampanaRecord(item)
  )

  const remappedLineaColumnas = remapLegacyMapeoIds(
    Array.isArray(columnasLineaRaw) ? columnasLineaRaw : [],
    'idABCConfigMapeoLinea',
    store.mapeosLinea.map(item => item.idABCConfigMapeoLinea)
  )

  const remappedCampanaColumnas = remapLegacyMapeoIds(
    Array.isArray(columnasCampanaRaw) ? columnasCampanaRaw : [],
    'idABCConfigMapeoCampana',
    store.mapeosCampana.map(item => item.idABCConfigMapeoCampana)
  )

  store.columnasLinea = remappedLineaColumnas.map(item => normalizeColumnaLineaSeed(item))
  store.columnasCampana = remappedCampanaColumnas.map(item => normalizeColumnaCampanaSeed(item))
  store.tareasLinea = Array.isArray(tareasLineaRaw)
    ? tareasLineaRaw
    : Array.isArray(tareasLineaRaw?.tareas)
      ? tareasLineaRaw.tareas
      : []
  store.horariosTareaLinea = Array.isArray(horariosLineaRaw)
    ? horariosLineaRaw
    : Array.isArray(tareasLineaRaw?.horarios)
      ? tareasLineaRaw.horarios
      : []

  store.tareasCampana = Array.isArray(tareasCampanaRaw)
    ? tareasCampanaRaw
    : Array.isArray(tareasCampanaRaw?.tareas)
      ? tareasCampanaRaw.tareas
      : []
  store.horariosTareaCampana = Array.isArray(horariosCampanaRaw)
    ? horariosCampanaRaw
    : Array.isArray(tareasCampanaRaw?.horarios)
      ? tareasCampanaRaw.horarios
      : []

  await loadCatalogos()
  console.log('[mock-server] data loaded', {
    mapeosLinea: store.mapeosLinea.length,
    mapeosCampana: store.mapeosCampana.length,
    columnasLinea: store.columnasLinea.length,
    columnasCampana: store.columnasCampana.length,
    tareasLinea: store.tareasLinea.length,
    tareasCampana: store.tareasCampana.length,
    horariosTareaLinea: store.horariosTareaLinea.length,
    horariosTareaCampana: store.horariosTareaCampana.length
  })
}

function send(res, status, data) {
  const payload = data === undefined ? '' : JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Suppress-Toast, ngrok-skip-browser-warning'
  })
  res.end(payload)
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch (err) {
        reject(err)
      }
    })
  })
}

function nextId(list, key) {
  const values = list.map(item => Number(item[key]) || 0)
  return values.length ? Math.max(...values) + 1 : 1
}

function normalizeMapeoLineaRecord(item, fallbackLineaId = 0) {
  const mapeoId = Number(item?.idABCConfigMapeoLinea ?? item?.id ?? 0)
  const lineaId = Number(item?.linea?.id ?? item?.idABCCatLineaNegocio ?? fallbackLineaId ?? 0)
  const campanaIdRaw = item?.linea?.campana?.id ?? item?.idABCCatCampana
  const campanaId = campanaIdRaw === null || campanaIdRaw === undefined || Number.isNaN(Number(campanaIdRaw))
    ? null
    : Number(campanaIdRaw)
  const rawActivo = item?.bolActivo
  const bolActivo = typeof rawActivo === 'boolean' ? rawActivo : Number(rawActivo ?? 1) === 1
  const rawEnvio = item?.enviar ?? item?.envio
  const envio = typeof rawEnvio === 'boolean' ? rawEnvio : Number(rawEnvio ?? 0) === 1

  return {
    ...item,
    idABCConfigMapeoLinea: mapeoId,
    id: mapeoId,
    idABCCatLineaNegocio: lineaId,
    linea: {
      id: lineaId,
      campana: campanaId !== null ? { id: campanaId } : null
    },
    bolActivo,
    enviar: envio,
    envio,
    fechaCreacion: item?.fechaCreacion ?? now(),
    fechaUltimaModificacion: item?.fechaUltimaModificacion ?? now()
  }
}

function normalizeMapeoCampanaRecord(item, fallbackLineaId = 0, fallbackCampanaId = 0) {
  const mapeoId = Number(item?.idABCConfigMapeoCampana ?? item?.idABCConfigMapeoLinea ?? item?.id ?? 0)
  const lineaId = Number(item?.linea?.id ?? item?.idABCCatLineaNegocio ?? fallbackLineaId ?? 0)
  const campanaId = Number(item?.linea?.campana?.id ?? item?.idABCCatCampana ?? fallbackCampanaId ?? 0)
  const normalized = normalizeMapeoLineaRecord(
    {
      ...item,
      idABCConfigMapeoLinea: mapeoId,
      idABCCatLineaNegocio: lineaId,
      idABCCatCampana: campanaId,
      linea: {
        id: lineaId,
        campana: campanaId ? { id: campanaId } : null
      }
    },
    lineaId
  )

  return {
    ...normalized,
    idABCConfigMapeoCampana: mapeoId,
    idABCConfigMapeoLinea: mapeoId,
    id: mapeoId,
    idABCCatCampana: campanaId,
    linea: {
      id: lineaId,
      campana: campanaId ? { id: campanaId } : null
    }
  }
}

function remapLegacyMapeoIds(items, key, validIds) {
  const valid = (validIds ?? []).map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
  if (!valid.length) return items

  const validSet = new Set(valid)
  const legacyIds = Array.from(
    new Set(
      (items ?? [])
        .map(item => Number(item?.[key] ?? 0))
        .filter(id => Number.isFinite(id) && id > 0 && !validSet.has(id))
    )
  )

  if (!legacyIds.length) return items

  const mapping = new Map()
  legacyIds.forEach((legacyId, index) => {
    mapping.set(legacyId, valid[index % valid.length])
  })

  return (items ?? []).map(item => {
    const currentId = Number(item?.[key] ?? 0)
    const nextId = mapping.get(currentId)
    if (!nextId) return item
    return {
      ...item,
      [key]: nextId
    }
  })
}

function normalizeColumnaLineaSeed(item) {
  const normalized = buildColumnaLineaRecord(
    Number(item?.idABCConfigMapeoLinea ?? 0),
    {
      idUsuario: Number(item?.idUsuario ?? item?.idABCUsuario ?? 1),
      columna: {
        tipo: { id: Number(item?.idABCCatColumna ?? item?.columna?.tipo?.id ?? 0) },
        bolActivo: item?.bolActivo ?? item?.columna?.bolActivo ?? true,
        regex: item?.regex ?? item?.columna?.regex ?? null,
        obligatorio: item?.obligatorio ?? item?.columna?.obligatorio ?? null,
        valor: item?.valor ?? item?.columna?.valor ?? null
      }
    }
  )

  normalized.fechaCreacion = item?.fechaCreacion ?? item?.columna?.fechaCreacion ?? normalized.fechaCreacion
  normalized.fechaUltimaModificacion = item?.fechaUltimaModificacion ?? item?.columna?.fechaUltimaModificacion ?? normalized.fechaUltimaModificacion
  if (normalized.columna) {
    normalized.columna.fechaCreacion = normalized.fechaCreacion
    normalized.columna.fechaUltimaModificacion = normalized.fechaUltimaModificacion
  }

  return normalized
}

function normalizeColumnaCampanaSeed(item) {
  const normalized = buildColumnaCampanaRecord(
    Number(item?.idABCConfigMapeoCampana ?? 0),
    {
      idUsuario: Number(item?.idUsuario ?? item?.idABCUsuario ?? 1),
      columna: {
        tipo: { id: Number(item?.idABCCatColumna ?? item?.columna?.tipo?.id ?? 0) },
        bolActivo: item?.bolActivo ?? item?.columna?.bolActivo ?? true,
        regex: item?.regex ?? item?.columna?.regex ?? null,
        obligatorio: item?.obligatorio ?? item?.columna?.obligatorio ?? null,
        valor: item?.valor ?? item?.columna?.valor ?? null
      }
    }
  )

  normalized.fechaCreacion = item?.fechaCreacion ?? item?.columna?.fechaCreacion ?? normalized.fechaCreacion
  normalized.fechaUltimaModificacion = item?.fechaUltimaModificacion ?? item?.columna?.fechaUltimaModificacion ?? normalized.fechaUltimaModificacion
  if (normalized.columna) {
    normalized.columna.fechaCreacion = normalized.fechaCreacion
    normalized.columna.fechaUltimaModificacion = normalized.fechaUltimaModificacion
  }

  return normalized
}

function findMapeoLinea(id) {
  return store.mapeosLinea.find(m => Number(m.idABCConfigMapeoLinea) === Number(id))
}

function getCampanaMapeoId(item) {
  return Number(item?.idABCConfigMapeoCampana ?? item?.idABCConfigMapeoLinea ?? item?.id ?? 0)
}

function findMapeoCampana(id) {
  const targetId = Number(id)
  return store.mapeosCampana.find(m => getCampanaMapeoId(m) === targetId)
}

function getTareaLineaId(item) {
  return Number(item?.idABCConfigTareaLinea ?? item?.id ?? 0)
}

function getTareaCampanaId(item) {
  return Number(item?.idABCConfigTareaCampana ?? item?.id ?? 0)
}

function findTareaLinea(id) {
  const targetId = Number(id)
  return store.tareasLinea.find(t => getTareaLineaId(t) === targetId)
}

function findTareaCampana(id) {
  const targetId = Number(id)
  return store.tareasCampana.find(t => getTareaCampanaId(t) === targetId)
}

function getHorarioLineaId(item) {
  return Number(item?.idABCConfigHorarioTareaLinea ?? item?.id ?? 0)
}

function getHorarioCampanaId(item) {
  return Number(item?.idABCConfigHorarioTareaCampana ?? item?.id ?? 0)
}

function findHorarioLinea(id) {
  const targetId = Number(id)
  return store.horariosTareaLinea.find(h => getHorarioLineaId(h) === targetId)
}

function findHorarioCampana(id) {
  const targetId = Number(id)
  return store.horariosTareaCampana.find(h => getHorarioCampanaId(h) === targetId)
}

function getHorarioTipoId(item) {
  return Number(item?.tipoHorario?.id ?? item?.tipo?.id ?? item?.idABCCatTipoHorario ?? 0)
}

function isHorarioActive(item) {
  return (item?.activo ?? item?.bolActivo ?? true) !== false
}

function countActiveByType(list, typeId) {
  return list.filter(h => getHorarioTipoId(h) === typeId && isHorarioActive(h)).length
}

function matchPath(urlPath, pattern) {
  const parts = urlPath.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)
  if (parts.length !== patternParts.length) return null
  const params = {}
  for (let i = 0; i < patternParts.length; i++) {
    const token = patternParts[i]
    const value = parts[i]
    if (token.startsWith(':')) {
      params[token.slice(1)] = value
    } else if (token !== value) {
      return null
    }
  }
  return params
}

function buildColumnaLineaRecord(mapeoId, payload) {
  const columnaId = Number(payload?.columna?.tipo?.id ?? payload?.columnaId ?? 0)
  const bolActivo = payload?.columna?.bolActivo ?? true
  const obligatorio = payload?.columna?.obligatorio ?? null
  const regex = payload?.columna?.regex ?? null
  const valor = payload?.columna?.valor ?? null
  const timestamp = now()
  return {
    idABCConfigMapeoLinea: Number(mapeoId),
    idABCCatColumna: columnaId,
    bolActivo,
    regex,
    obligatorio,
    valor,
    idUsuario: Number(payload?.idUsuario ?? payload?.idABCUsuario ?? 1),
    llaveMapeoLineaColumna: {
      idABCConfigMapeoLinea: Number(mapeoId),
      idABCCatColumna: columnaId
    },
    columna: {
      idABCConfigMapeoLinea: Number(mapeoId),
      tipo: { id: columnaId, idABCCatColumna: columnaId },
      bolActivo,
      obligatorio,
      regex,
      valor,
      fechaCreacion: timestamp,
      fechaUltimaModificacion: timestamp
    },
    fechaCreacion: timestamp,
    fechaUltimaModificacion: timestamp
  }
}

function buildColumnaCampanaRecord(mapeoId, payload) {
  const columnaId = Number(payload?.columna?.tipo?.id ?? payload?.columnaId ?? 0)
  const bolActivo = payload?.columna?.bolActivo ?? true
  const obligatorio = payload?.columna?.obligatorio ?? null
  const regex = payload?.columna?.regex ?? null
  const valor = payload?.columna?.valor ?? null
  const timestamp = now()
  return {
    idABCConfigMapeoCampana: Number(mapeoId),
    idABCCatColumna: columnaId,
    bolActivo,
    regex,
    obligatorio,
    valor,
    idUsuario: Number(payload?.idUsuario ?? payload?.idABCUsuario ?? 1),
    llaveMapeoCampanaColumna: {
      idABCConfigMapeoCampana: Number(mapeoId),
      idABCCatColumna: columnaId
    },
    columna: {
      idABCConfigMapeoCampana: Number(mapeoId),
      tipo: { id: columnaId, idABCCatColumna: columnaId },
      bolActivo,
      obligatorio,
      regex,
      valor,
      fechaCreacion: timestamp,
      fechaUltimaModificacion: timestamp
    },
    fechaCreacion: timestamp,
    fechaUltimaModificacion: timestamp
  }
}

function buildTareaLineaRecord(lineaId, payload) {
  const base = payload?.tarea ?? payload ?? {}
  const ejecucionId = Number(base?.ejecucion?.id ?? 1)
  return {
    idABCConfigTareaLinea: Number(base.idABCConfigTareaLinea ?? base.id ?? 0),
    linea: {
      id: Number(base?.linea?.id ?? base.idABCCatLineaNegocio ?? lineaId ?? 0),
      campana: null
    },
    ingesta: base.ingesta ?? '',
    tipo: {
      id: Number(base?.tipo?.id ?? 1),
      nombre: base?.tipo?.nombre ?? 'Ingesta'
    },
    ejecucion: {
      id: ejecucionId,
      nombre: base?.ejecucion?.nombre ?? (ejecucionId === 2 ? 'Manual' : 'Automatica')
    },
    bolActivo: base.bolActivo ?? true,
    fechaCreacion: base.fechaCreacion ?? now(),
    fechaUltimaModificacion: now()
  }
}

function buildTareaCampanaRecord(lineaId, campanaId, payload) {
  const base = payload?.tarea ?? payload ?? {}
  const ejecucionId = Number(base?.ejecucion?.id ?? 1)
  return {
    idABCConfigTareaCampana: Number(base.idABCConfigTareaCampana ?? base.id ?? 0),
    linea: {
      id: Number(base?.linea?.id ?? base.idABCCatLineaNegocio ?? lineaId ?? 0),
      campana: {
        id: Number(base?.linea?.campana?.id ?? base.idABCCatCampana ?? campanaId ?? 0)
      }
    },
    ingesta: base.ingesta ?? '',
    tipo: {
      id: Number(base?.tipo?.id ?? 1),
      nombre: base?.tipo?.nombre ?? 'Ingesta'
    },
    ejecucion: {
      id: ejecucionId,
      nombre: base?.ejecucion?.nombre ?? (ejecucionId === 2 ? 'Manual' : 'Automatica')
    },
    bolActivo: base.bolActivo ?? true,
    fechaCreacion: base.fechaCreacion ?? now(),
    fechaUltimaModificacion: now()
  }
}

const weekdayNameById = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes'
}

const scheduleTypeNameById = {
  1: 'Carga',
  2: 'Validación',
  3: 'Envío'
}

function resolveHoraNombre(hora) {
  const rawNombre = hora?.nombre
  if (typeof rawNombre === 'string' && rawNombre.includes(':')) return rawNombre
  const rawId = Number(hora?.id)
  if (Number.isNaN(rawId)) return ''
  const hours = String(Math.floor(rawId / 100)).padStart(2, '0')
  const minutes = String(rawId % 100).padStart(2, '0')
  return `${hours}:${minutes}`
}

function extractLegacyHorarios(base) {
  const legacy = []
  if (base?.carga?.dia || base?.carga?.hora) {
    legacy.push({ tipo: { id: 1 }, dia: { nombre: base?.carga?.dia }, hora: { nombre: base?.carga?.hora } })
  }
  if (base?.validacion?.dia || base?.validacion?.hora) {
    legacy.push({ tipo: { id: 2 }, dia: { nombre: base?.validacion?.dia }, hora: { nombre: base?.validacion?.hora } })
  }
  if (base?.envio?.dia || base?.envio?.hora) {
    legacy.push({ tipo: { id: 3 }, dia: { nombre: base?.envio?.dia }, hora: { nombre: base?.envio?.hora } })
  }
  return legacy
}

function buildHorarioRecord(baseHorario, idKey, parentIdKey, parentId, nextHorarioId, fallbackTypeId = 1) {
  const diaId = Number(baseHorario?.dia?.id ?? 0)
  const horaId = Number(baseHorario?.dia?.hora?.id ?? baseHorario?.hora?.id ?? 0)
  const typeId = Number(baseHorario?.tipoHorario?.id ?? baseHorario?.tipo?.id ?? fallbackTypeId)
  return {
    [idKey]: nextHorarioId,
    [parentIdKey]: Number(parentId),
    tarea: { id: Number(parentId) },
    tipoHorario: {
      id: typeId,
      nombre: baseHorario?.tipoHorario?.nombre ?? scheduleTypeNameById[typeId] ?? 'Horario'
    },
    dia: {
      id: diaId,
      nombre: baseHorario?.dia?.nombre ?? weekdayNameById[diaId] ?? '',
      hora: {
        id: horaId,
        nombre: baseHorario?.dia?.hora?.nombre ?? baseHorario?.hora?.nombre ?? resolveHoraNombre(baseHorario?.dia?.hora ?? baseHorario?.hora)
      }
    },
    activo: baseHorario?.activo ?? baseHorario?.bolActivo ?? true,
    fechaCreacion: baseHorario?.fechaCreacion ?? now(),
    fechaUltimaModificacion: now()
  }
}

function buildTareaLineaHorarios(tareaId, payload) {
  const bodyHorarios = Array.isArray(payload?.horarios) && payload.horarios.length
    ? payload.horarios
    : extractLegacyHorarios(payload?.tarea ?? payload ?? {})

  let nextHorarioId = nextId(store.horariosTareaLinea, 'idABCConfigHorarioTareaLinea')
  return bodyHorarios.map((horario, index) => {
    const record = buildHorarioRecord(
      horario,
      'idABCConfigHorarioTareaLinea',
      'idABCConfigTareaLinea',
      tareaId,
      nextHorarioId,
      (index % 3) + 1
    )
    nextHorarioId += 1
    return record
  })
}

function buildTareaCampanaHorarios(tareaId, payload) {
  const bodyHorarios = Array.isArray(payload?.horarios) && payload.horarios.length
    ? payload.horarios
    : extractLegacyHorarios(payload?.tarea ?? payload ?? {})

  let nextHorarioId = nextId(store.horariosTareaCampana, 'idABCConfigHorarioTareaCampana')
  return bodyHorarios.map((horario, index) => {
    const record = buildHorarioRecord(
      horario,
      'idABCConfigHorarioTareaCampana',
      'idABCConfigTareaCampana',
      tareaId,
      nextHorarioId,
      (index % 3) + 1
    )
    nextHorarioId += 1
    return record
  })
}

function withTareaLineaHorarios(tarea) {
  const tareaId = getTareaLineaId(tarea)
  const horarios = store.horariosTareaLinea.filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaLinea) === tareaId)
  return { tarea, horarios }
}

function withTareaCampanaHorarios(tarea) {
  const tareaId = getTareaCampanaId(tarea)
  const horarios = store.horariosTareaCampana.filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaCampana) === tareaId)
  return { tarea, horarios }
}

function withColumnCounts(list, scope) {
  if (scope === 'linea') {
    return list.map(m => ({
      ...m,
      columnas: store.columnasLinea.filter(c => Number(c.idABCConfigMapeoLinea) === Number(m.idABCConfigMapeoLinea)).length
    }))
  }
  return list.map(m => ({
    ...m,
    columnas: store.columnasCampana.filter(c => Number(c.idABCConfigMapeoCampana) === getCampanaMapeoId(m)).length
  }))
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204)

    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    const pathname = url.pathname

    console.log('[mock-server] request', {
      method: req.method,
      pathname,
      query: url.search
    })

    if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
      return send(res, 200, {
        status: 'ok',
        apiBase: `${url.origin}${API_PREFIX}`,
        hint: 'Use the /api endpoints (e.g. /api/lineas/mapeos).'
      })
    }

    if (!pathname.startsWith(API_PREFIX)) {
      return send(res, 404, { message: 'Not found', hint: 'Try /api or /health.' })
    }

    const pathOnly = pathname.slice(API_PREFIX.length)

    if (req.method === 'GET') {
      if (pathOnly === '/catalogos') {
        return send(res, 200, store.catalogos)
      }

      const catalogoParams = matchPath(pathOnly, '/catalogos/:codigo')
      if (catalogoParams) {
        const code = String(catalogoParams.codigo || '').toUpperCase()
        const match = store.catalogos.find(c => String(c.codigo).toUpperCase() === code)
        return send(res, 200, match?.registros || [])
      }

      if (pathOnly === '/lineas/mapeos') {
        return send(res, 200, withColumnCounts(store.mapeosLinea, 'linea'))
      }

      if (pathOnly === '/lineas/campanas/mapeos') {
        console.log('[mock-server] GET /lineas/campanas/mapeos', {
          count: store.mapeosCampana.length,
          sampleId: store.mapeosCampana[0]?.idABCConfigMapeoCampana ?? null
        })
        return send(res, 200, withColumnCounts(store.mapeosCampana, 'campana'))
      }

      if (pathOnly === '/lineas/tareas') {
        return send(res, 200, store.tareasLinea.map(withTareaLineaHorarios))
      }

      if (pathOnly === '/lineas/campanas/tareas') {
        return send(res, 200, store.tareasCampana.map(withTareaCampanaHorarios))
      }

      const lineasMapeoParams = matchPath(pathOnly, '/lineas/:lineaId/mapeos')
      if (lineasMapeoParams) {
        const lineaId = Number(lineasMapeoParams.lineaId)
        const list = store.mapeosLinea.filter(m => Number(m?.linea?.id ?? m?.idABCCatLineaNegocio) === lineaId)
        return send(res, 200, withColumnCounts(list, 'linea'))
      }

      const lineasTareaParams = matchPath(pathOnly, '/lineas/:lineaId/tareas')
      if (lineasTareaParams) {
        const lineaId = Number(lineasTareaParams.lineaId)
        const list = store.tareasLinea.filter(t => Number(t?.linea?.id ?? t?.idABCCatLineaNegocio) === lineaId)
        return send(res, 200, list.map(withTareaLineaHorarios))
      }

      const campanaTareaParams = matchPath(pathOnly, '/lineas/:lineaId/campanas/:campanaId/tareas')
      if (campanaTareaParams) {
        const lineaId = Number(campanaTareaParams.lineaId)
        const campanaId = Number(campanaTareaParams.campanaId)
        const list = store.tareasCampana.filter(t =>
          Number(t?.linea?.id ?? t?.idABCCatLineaNegocio) === lineaId &&
          Number(t?.linea?.campana?.id ?? t?.idABCCatCampana) === campanaId
        )
        return send(res, 200, list.map(withTareaCampanaHorarios))
      }

      const horariosLineaParams = matchPath(pathOnly, '/lineas/tareas/:tareaId/horarios')
      if (horariosLineaParams) {
        const tareaId = Number(horariosLineaParams.tareaId)
        const list = store.horariosTareaLinea.filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaLinea) === tareaId)
        return send(res, 200, list)
      }

      const horariosCampanaParams = matchPath(pathOnly, '/campanas/tareas/:tareaId/horarios')
      if (horariosCampanaParams) {
        const tareaId = Number(horariosCampanaParams.tareaId)
        const list = store.horariosTareaCampana.filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaCampana) === tareaId)
        return send(res, 200, list)
      }

      if (pathOnly === '/lineas/mapeos/0/columnas') {
        return send(res, 200, store.columnasLinea)
      }

      const columnasLineaParams = matchPath(pathOnly, '/lineas/mapeos/:mapeoId/columnas')
      if (columnasLineaParams) {
        const mapeoId = Number(columnasLineaParams.mapeoId)
        const list = store.columnasLinea.filter(c => Number(c.idABCConfigMapeoLinea) === mapeoId)
        return send(res, 200, list)
      }

      if (pathOnly === '/campanas/mapeos/0/columnas') {
        return send(res, 200, store.columnasCampana)
      }

      const columnasCampanaParams = matchPath(pathOnly, '/campanas/mapeos/:mapeoId/columnas')
      if (columnasCampanaParams) {
        const mapeoId = Number(columnasCampanaParams.mapeoId)
        const list = store.columnasCampana.filter(c => Number(c.idABCConfigMapeoCampana) === mapeoId)
        return send(res, 200, list)
      }
    }

    if (req.method === 'POST') {
      const lineasCreateParams = matchPath(pathOnly, '/lineas/:lineaId/mapeos')
      if (lineasCreateParams) {
        const body = await parseBody(req)
        const lineaId = Number(lineasCreateParams.lineaId)
        const next = nextId(store.mapeosLinea, 'idABCConfigMapeoLinea')
        const base = body.mapeo ?? body
        const record = normalizeMapeoLineaRecord({
          idABCConfigMapeoLinea: next,
          idABCCatLineaNegocio: Number(base.idABCCatLineaNegocio ?? lineaId),
          idABCUsuario: Number(body.idUsuario ?? body.idABCUsuario ?? 1),
          nombre: base.nombre ?? `Mapeo Linea ${next}`,
          descripcion: base.descripcion ?? '',
          bolActivo: base.bolActivo ?? true,
          validar: base.validar ?? false,
          envio: base.envio ?? false,
          columnas: 0,
          fechaCreacion: now(),
          fechaUltimaModificacion: now()
        }, lineaId)
        store.mapeosLinea.push(record)
        return send(res, 200, record)
      }

      const campanaCreateParams = matchPath(pathOnly, '/lineas/:lineaId/campanas/:campanaId/mapeos')
      if (campanaCreateParams) {
        const body = await parseBody(req)
        const lineaId = Number(campanaCreateParams.lineaId)
        const campanaId = Number(campanaCreateParams.campanaId)
        const next = nextId(store.mapeosCampana, 'idABCConfigMapeoCampana')
        const base = body.mapeo ?? body
        const record = normalizeMapeoCampanaRecord({
          idABCConfigMapeoCampana: next,
          idABCConfigMapeoLinea: next,
          idABCCatLineaNegocio: Number(base.idABCCatLineaNegocio ?? lineaId),
          idABCCatCampana: Number(base.idABCCatCampana ?? campanaId),
          idABCUsuario: Number(body.idUsuario ?? body.idABCUsuario ?? 1),
          nombre: base.nombre ?? `Mapeo Campaña ${next}`,
          descripcion: base.descripcion ?? '',
          bolActivo: base.bolActivo ?? true,
          validar: base.validar ?? false,
          envio: base.envio ?? false,
          columnas: 0,
          fechaCreacion: now(),
          fechaUltimaModificacion: now()
        }, lineaId, campanaId)
        store.mapeosCampana.push(record)
        return send(res, 200, record)
      }

      const tareasLineaCreate = matchPath(pathOnly, '/lineas/:lineaId/tareas')
      if (tareasLineaCreate) {
        const body = await parseBody(req)
        const lineaId = Number(tareasLineaCreate.lineaId)
        const next = nextId(store.tareasLinea, 'idABCConfigTareaLinea')
        const tareaRecord = {
          ...buildTareaLineaRecord(lineaId, body),
          idABCConfigTareaLinea: next
        }
        store.tareasLinea.push(tareaRecord)
        return send(res, 200, tareaRecord)
      }

      const tareasCampanaCreate = matchPath(pathOnly, '/lineas/:lineaId/campanas/:campanaId/tareas')
      if (tareasCampanaCreate) {
        const body = await parseBody(req)
        const lineaId = Number(tareasCampanaCreate.lineaId)
        const campanaId = Number(tareasCampanaCreate.campanaId)
        const next = nextId(store.tareasCampana, 'idABCConfigTareaCampana')
        const tareaRecord = {
          ...buildTareaCampanaRecord(lineaId, campanaId, body),
          idABCConfigTareaCampana: next
        }
        store.tareasCampana.push(tareaRecord)
        return send(res, 200, tareaRecord)
      }

      const horariosLineaCreate = matchPath(pathOnly, '/lineas/tareas/:tareaId/horarios')
      if (horariosLineaCreate) {
        const body = await parseBody(req)
        const tareaId = Number(horariosLineaCreate.tareaId)
        const currentTask = findTareaLinea(tareaId)
        if (!currentTask) return send(res, 404, { message: 'Not found' })

        const incoming = Array.isArray(body?.horarios)
          ? body.horarios
          : Array.isArray(body)
            ? body
            : [body?.horario ?? body]

        let nextHorarioId = nextId(store.horariosTareaLinea, 'idABCConfigHorarioTareaLinea')
        const created = incoming.map((horario, index) => {
          const record = buildHorarioRecord(
            horario,
            'idABCConfigHorarioTareaLinea',
            'idABCConfigTareaLinea',
            tareaId,
            nextHorarioId,
            (index % 3) + 1
          )
          nextHorarioId += 1
          return record
        })

        store.horariosTareaLinea.push(...created)
        return send(res, 200, created)
      }

      const horariosCampanaCreate = matchPath(pathOnly, '/campanas/tareas/:tareaId/horarios')
      if (horariosCampanaCreate) {
        const body = await parseBody(req)
        const tareaId = Number(horariosCampanaCreate.tareaId)
        const currentTask = findTareaCampana(tareaId)
        if (!currentTask) return send(res, 404, { message: 'Not found' })

        const incoming = Array.isArray(body?.horarios)
          ? body.horarios
          : Array.isArray(body)
            ? body
            : [body?.horario ?? body]

        let nextHorarioId = nextId(store.horariosTareaCampana, 'idABCConfigHorarioTareaCampana')
        const created = incoming.map((horario, index) => {
          const record = buildHorarioRecord(
            horario,
            'idABCConfigHorarioTareaCampana',
            'idABCConfigTareaCampana',
            tareaId,
            nextHorarioId,
            (index % 3) + 1
          )
          nextHorarioId += 1
          return record
        })

        store.horariosTareaCampana.push(...created)
        return send(res, 200, created)
      }

      const columnasLineaCreate = matchPath(pathOnly, '/lineas/mapeos/:mapeoId/columnas')
      if (columnasLineaCreate) {
        const body = await parseBody(req)
        const mapeoId = Number(columnasLineaCreate.mapeoId)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId ?? 0)
        const exists = store.columnasLinea.some(c => Number(c.idABCConfigMapeoLinea) === mapeoId && Number(c.idABCCatColumna) === columnaId)
        if (exists) return send(res, 409, { message: 'La columna ya existe para este mapeo.' })
        const record = buildColumnaLineaRecord(mapeoId, body)
        store.columnasLinea.push(record)
        return send(res, 200, record)
      }

      const columnasCampanaCreate = matchPath(pathOnly, '/campanas/mapeos/:mapeoId/columnas')
      if (columnasCampanaCreate) {
        const body = await parseBody(req)
        const mapeoId = Number(columnasCampanaCreate.mapeoId)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId ?? 0)
        const exists = store.columnasCampana.some(c => Number(c.idABCConfigMapeoCampana) === mapeoId && Number(c.idABCCatColumna) === columnaId)
        if (exists) return send(res, 409, { message: 'La columna ya existe para este mapeo.' })
        const record = buildColumnaCampanaRecord(mapeoId, body)
        store.columnasCampana.push(record)
        return send(res, 200, record)
      }

      if (pathOnly === '/campanas/mapeos/0/columnas') {
        const body = await parseBody(req)
        const record = buildColumnaCampanaRecord(0, body)
        store.columnasCampana.push(record)
        return send(res, 200, record)
      }

      if (pathOnly === '/bitacoras/eventos') {
        return send(res, 200, { ok: true })
      }
    }

    if (req.method === 'PUT') {
      if (pathOnly === '/lineas/mapeos') {
        const body = await parseBody(req)
        const payload = body.mapeo ?? body
        const id = Number(payload.id ?? payload.idABCConfigMapeoLinea)
        const current = findMapeoLinea(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        const normalized = normalizeMapeoLineaRecord(
          {
            ...current,
            ...payload,
            idABCConfigMapeoLinea: id,
            id
          },
          Number(current?.linea?.id ?? current?.idABCCatLineaNegocio ?? 0)
        )
        Object.assign(current, normalized, {
          fechaCreacion: current.fechaCreacion ?? normalized.fechaCreacion,
          fechaUltimaModificacion: now()
        })
        return send(res, 200, current)
      }

      if (pathOnly === '/lineas/tareas') {
        const body = await parseBody(req)
        const payload = body.tarea ?? body
        const id = Number(payload.id ?? payload.idABCConfigTareaLinea)
        const current = findTareaLinea(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        const lineaId = Number(payload?.linea?.id ?? payload?.idABCCatLineaNegocio ?? current?.linea?.id ?? 0)
        const updatedRecord = {
          ...buildTareaLineaRecord(lineaId, body),
          idABCConfigTareaLinea: id,
          fechaCreacion: current.fechaCreacion,
          fechaUltimaModificacion: now()
        }
        Object.assign(current, updatedRecord)
        return send(res, 200, withTareaLineaHorarios(current))
      }

      if (pathOnly === '/lineas/campanas/tareas') {
        const body = await parseBody(req)
        const payload = body.tarea ?? body
        const id = Number(payload.id ?? payload.idABCConfigTareaCampana)
        const current = findTareaCampana(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        const lineaId = Number(payload?.linea?.id ?? payload?.idABCCatLineaNegocio ?? current?.linea?.id ?? 0)
        const campanaId = Number(payload?.linea?.campana?.id ?? payload?.idABCCatCampana ?? current?.linea?.campana?.id ?? 0)
        const updatedRecord = {
          ...buildTareaCampanaRecord(lineaId, campanaId, body),
          idABCConfigTareaCampana: id,
          fechaCreacion: current.fechaCreacion,
          fechaUltimaModificacion: now()
        }
        Object.assign(current, updatedRecord)
        return send(res, 200, withTareaCampanaHorarios(current))
      }

      if (pathOnly === '/lineas/campanas/mapeos') {
        const body = await parseBody(req)
        const payload = body.mapeo ?? body
        const id = Number(payload.id ?? payload.idABCConfigMapeoCampana ?? payload.idABCConfigMapeoLinea)
        const current = findMapeoCampana(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        const normalized = normalizeMapeoCampanaRecord(
          {
            ...current,
            ...payload,
            idABCConfigMapeoCampana: id,
            idABCConfigMapeoLinea: id,
            id
          },
          Number(current?.linea?.id ?? current?.idABCCatLineaNegocio ?? 0),
          Number(current?.linea?.campana?.id ?? current?.idABCCatCampana ?? 0)
        )
        Object.assign(current, normalized, {
          fechaCreacion: current.fechaCreacion ?? normalized.fechaCreacion,
          fechaUltimaModificacion: now()
        })
        return send(res, 200, current)
      }

      const columnasLineaUpdate = matchPath(pathOnly, '/lineas/mapeos/:mapeoId/columnas')
      if (columnasLineaUpdate) {
        const body = await parseBody(req)
        const mapeoId = Number(columnasLineaUpdate.mapeoId)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId)
        const current = mapeoId === 0
          ? store.columnasLinea.find(c => Number(c.idABCCatColumna) === columnaId)
          : store.columnasLinea.find(c => Number(c.idABCConfigMapeoLinea) === mapeoId && Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.regex = body?.columna?.regex ?? current.regex
        current.bolActivo = body?.columna?.bolActivo ?? current.bolActivo
        current.obligatorio = body?.columna?.obligatorio ?? current.obligatorio
        current.valor = body?.columna?.valor ?? current.valor
        current.idUsuario = Number(body?.idUsuario ?? body?.idABCUsuario ?? current.idUsuario ?? 1)
        if (current.columna) {
          current.columna.regex = current.regex
          current.columna.bolActivo = current.bolActivo
          current.columna.obligatorio = current.obligatorio
          current.columna.valor = current.valor
          current.columna.fechaUltimaModificacion = now()
        }
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      if (pathOnly === '/lineas/mapeos/columnas') {
        const body = await parseBody(req)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId)
        const current = store.columnasLinea.find(c => Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.regex = body?.columna?.regex ?? current.regex
        current.bolActivo = body?.columna?.bolActivo ?? current.bolActivo
        current.obligatorio = body?.columna?.obligatorio ?? current.obligatorio
        current.valor = body?.columna?.valor ?? current.valor
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      const columnasCampanaUpdate = matchPath(pathOnly, '/campanas/mapeos/:mapeoId/columnas')
      if (columnasCampanaUpdate) {
        const body = await parseBody(req)
        const mapeoId = Number(columnasCampanaUpdate.mapeoId)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId)
        const current = mapeoId === 0
          ? store.columnasCampana.find(c => Number(c.idABCCatColumna) === columnaId)
          : store.columnasCampana.find(c => Number(c.idABCConfigMapeoCampana) === mapeoId && Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.regex = body?.columna?.regex ?? current.regex
        current.bolActivo = body?.columna?.bolActivo ?? current.bolActivo
        current.obligatorio = body?.columna?.obligatorio ?? current.obligatorio
        current.valor = body?.columna?.valor ?? current.valor
        current.idUsuario = Number(body?.idUsuario ?? body?.idABCUsuario ?? current.idUsuario ?? 1)
        if (current.columna) {
          current.columna.regex = current.regex
          current.columna.bolActivo = current.bolActivo
          current.columna.obligatorio = current.obligatorio
          current.columna.valor = current.valor
          current.columna.fechaUltimaModificacion = now()
        }
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      if (pathOnly === '/campanas/mapeos/columnas') {
        const body = await parseBody(req)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId)
        const current = store.columnasCampana.find(c => Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.regex = body?.columna?.regex ?? current.regex
        current.bolActivo = body?.columna?.bolActivo ?? current.bolActivo
        current.obligatorio = body?.columna?.obligatorio ?? current.obligatorio
        current.valor = body?.columna?.valor ?? current.valor
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }
    }

    if (req.method === 'PATCH') {
      if (pathOnly === '/lineas/mapeos/activar' || pathOnly === '/lineas/mapeos/desactivar') {
        const body = await parseBody(req)
        const id = Number(body?.mapeo?.id ?? body?.mapeo?.idABCConfigMapeoLinea ?? body?.id)
        const current = findMapeoLinea(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = pathOnly.endsWith('/activar')
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      if (pathOnly === '/lineas/tareas/activar' || pathOnly === '/lineas/tareas/desactivar') {
        const body = await parseBody(req)
        const id = Number(body?.tarea?.id ?? body?.id)
        const current = findTareaLinea(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = pathOnly.endsWith('/activar')
        current.fechaUltimaModificacion = now()
        return send(res, 200, withTareaLineaHorarios(current))
      }

      if (pathOnly === '/lineas/campanas/tareas/activar' || pathOnly === '/lineas/campanas/tareas/desactivar') {
        const body = await parseBody(req)
        const id = Number(body?.tarea?.id ?? body?.id)
        const current = findTareaCampana(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = pathOnly.endsWith('/activar')
        current.fechaUltimaModificacion = now()
        return send(res, 200, withTareaCampanaHorarios(current))
      }

      const horariosLineaToggle = matchPath(pathOnly, '/lineas/tareas/:tareaId/horarios/:action')
      if (horariosLineaToggle && (horariosLineaToggle.action === 'activar' || horariosLineaToggle.action === 'desactivar')) {
        const body = await parseBody(req)
        const tareaId = Number(horariosLineaToggle.tareaId)
        const horarioId = Number(body?.horario?.id ?? body?.id)
        const shouldActivate = horariosLineaToggle.action === 'activar'
        const tareaHorarios = store.horariosTareaLinea.filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaLinea) === tareaId)

        if (horarioId) {
          const current = findHorarioLinea(horarioId)
          if (!current) return send(res, 404, { message: 'Not found' })
          if (Number(current?.tarea?.id ?? current?.idABCConfigTareaLinea) !== tareaId) {
            return send(res, 400, { message: 'Horario does not belong to tarea' })
          }

          if (!shouldActivate) {
            const tipoId = getHorarioTipoId(current)
            if ((tipoId === 1 || tipoId === 2) && isHorarioActive(current)) {
              const activeCount = countActiveByType(tareaHorarios, tipoId)
              if (activeCount <= 1) {
                const stageLabel = tipoId === 1 ? 'Carga' : 'Validación'
                return send(res, 400, { message: `Debe permanecer al menos un horario activo en ${stageLabel}.` })
              }
            }
          }

          current.activo = shouldActivate
          current.bolActivo = shouldActivate
          current.fechaUltimaModificacion = now()
          return send(res, 200, current)
        }

        if (!shouldActivate) {
          const cargaActive = countActiveByType(tareaHorarios, 1)
          const validacionActive = countActiveByType(tareaHorarios, 2)
          if (cargaActive > 0 || validacionActive > 0) {
            return send(res, 400, { message: 'Debe permanecer al menos un horario activo en Carga y Validación.' })
          }
        }

        const updated = store.horariosTareaLinea
          .filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaLinea) === tareaId)
          .map(h => ({ ...h, activo: shouldActivate, bolActivo: shouldActivate, fechaUltimaModificacion: now() }))

        store.horariosTareaLinea = store.horariosTareaLinea.map(h => {
          const found = updated.find(u => getHorarioLineaId(u) === getHorarioLineaId(h))
          return found ?? h
        })
        return send(res, 200, updated)
      }

      const horariosCampanaToggle = matchPath(pathOnly, '/campanas/tareas/:tareaId/horarios/:action')
      if (horariosCampanaToggle && (horariosCampanaToggle.action === 'activar' || horariosCampanaToggle.action === 'desactivar')) {
        const body = await parseBody(req)
        const tareaId = Number(horariosCampanaToggle.tareaId)
        const horarioId = Number(body?.horario?.id ?? body?.id)
        const shouldActivate = horariosCampanaToggle.action === 'activar'
        const tareaHorarios = store.horariosTareaCampana.filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaCampana) === tareaId)

        if (horarioId) {
          const current = findHorarioCampana(horarioId)
          if (!current) return send(res, 404, { message: 'Not found' })
          if (Number(current?.tarea?.id ?? current?.idABCConfigTareaCampana) !== tareaId) {
            return send(res, 400, { message: 'Horario does not belong to tarea' })
          }

          if (!shouldActivate) {
            const tipoId = getHorarioTipoId(current)
            if ((tipoId === 1 || tipoId === 2) && isHorarioActive(current)) {
              const activeCount = countActiveByType(tareaHorarios, tipoId)
              if (activeCount <= 1) {
                const stageLabel = tipoId === 1 ? 'Carga' : 'Validación'
                return send(res, 400, { message: `Debe permanecer al menos un horario activo en ${stageLabel}.` })
              }
            }
          }

          current.activo = shouldActivate
          current.bolActivo = shouldActivate
          current.fechaUltimaModificacion = now()
          return send(res, 200, current)
        }

        if (!shouldActivate) {
          const cargaActive = countActiveByType(tareaHorarios, 1)
          const validacionActive = countActiveByType(tareaHorarios, 2)
          if (cargaActive > 0 || validacionActive > 0) {
            return send(res, 400, { message: 'Debe permanecer al menos un horario activo en Carga y Validación.' })
          }
        }

        const updated = store.horariosTareaCampana
          .filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaCampana) === tareaId)
          .map(h => ({ ...h, activo: shouldActivate, bolActivo: shouldActivate, fechaUltimaModificacion: now() }))

        store.horariosTareaCampana = store.horariosTareaCampana.map(h => {
          const found = updated.find(u => getHorarioCampanaId(u) === getHorarioCampanaId(h))
          return found ?? h
        })
        return send(res, 200, updated)
      }

      if (pathOnly === '/lineas/campanas/mapeos/activar' || pathOnly === '/lineas/campanas/mapeos/desactivar') {
        const body = await parseBody(req)
        const id = Number(body?.mapeo?.id ?? body?.mapeo?.idABCConfigMapeoCampana ?? body?.mapeo?.idABCConfigMapeoLinea ?? body?.id)
        const current = findMapeoCampana(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = pathOnly.endsWith('/activar')
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      const columnasLineaToggle = matchPath(pathOnly, '/lineas/mapeos/:mapeoId/columnas/:action')
      if (columnasLineaToggle && (columnasLineaToggle.action === 'activar' || columnasLineaToggle.action === 'desactivar')) {
        const body = await parseBody(req)
        const mapeoId = Number(columnasLineaToggle.mapeoId)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId ?? body?.id)
        const current = mapeoId === 0
          ? store.columnasLinea.find(c => Number(c.idABCCatColumna) === columnaId)
          : store.columnasLinea.find(c => Number(c.idABCConfigMapeoLinea) === mapeoId && Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = columnasLineaToggle.action === 'activar'
        if (current.columna) {
          current.columna.bolActivo = current.bolActivo
          current.columna.fechaUltimaModificacion = now()
        }
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      const columnasCampanaToggle = matchPath(pathOnly, '/campanas/mapeos/:mapeoId/columnas/:action')
      if (columnasCampanaToggle && (columnasCampanaToggle.action === 'activar' || columnasCampanaToggle.action === 'desactivar')) {
        const body = await parseBody(req)
        const mapeoId = Number(columnasCampanaToggle.mapeoId)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId ?? body?.id)
        const current = mapeoId === 0
          ? store.columnasCampana.find(c => Number(c.idABCCatColumna) === columnaId)
          : store.columnasCampana.find(c => Number(c.idABCConfigMapeoCampana) === mapeoId && Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = columnasCampanaToggle.action === 'activar'
        if (current.columna) {
          current.columna.bolActivo = current.bolActivo
          current.columna.fechaUltimaModificacion = now()
        }
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }
    }

    if (req.method === 'DELETE') {
      const mapeoLineaDelete = matchPath(pathOnly, '/lineas/:lineaId/mapeos/:mapeoId')
      if (mapeoLineaDelete) {
        const mapeoId = Number(mapeoLineaDelete.mapeoId)
        store.mapeosLinea = store.mapeosLinea.filter(m => Number(m.idABCConfigMapeoLinea) !== mapeoId)
        store.columnasLinea = store.columnasLinea.filter(c => Number(c.idABCConfigMapeoLinea) !== mapeoId)
        return send(res, 200, { ok: true })
      }

      const tareaLineaDelete = matchPath(pathOnly, '/lineas/:lineaId/tareas/:tareaId')
      if (tareaLineaDelete) {
        const tareaId = Number(tareaLineaDelete.tareaId)
        store.tareasLinea = store.tareasLinea.filter(t => getTareaLineaId(t) !== tareaId)
        store.horariosTareaLinea = store.horariosTareaLinea.filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaLinea) !== tareaId)
        return send(res, 200, { ok: true })
      }

      const tareaCampanaDelete = matchPath(pathOnly, '/lineas/:lineaId/campanas/:campanaId/tareas/:tareaId')
      if (tareaCampanaDelete) {
        const tareaId = Number(tareaCampanaDelete.tareaId)
        store.tareasCampana = store.tareasCampana.filter(t => getTareaCampanaId(t) !== tareaId)
        store.horariosTareaCampana = store.horariosTareaCampana.filter(h => Number(h?.tarea?.id ?? h?.idABCConfigTareaCampana) !== tareaId)
        return send(res, 200, { ok: true })
      }
    }

    return send(res, 404, { message: 'Not found' })
  } catch (err) {
    return send(res, 500, { message: 'Mock server error', error: String(err) })
  }
})

await loadData()

server.listen(PORT, () => {
  console.log(`[mock-server] listening on http://localhost:${PORT}${API_PREFIX}`)
})
