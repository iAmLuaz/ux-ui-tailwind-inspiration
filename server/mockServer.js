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
  catalogos: {},
  mapeosLinea: [],
  mapeosCampana: [],
  columnasLinea: [],
  columnasCampana: []
}

async function loadCatalogos() {
  const base = 'api/catalogos'
  const codes = ['LNN', 'CMP', 'CLM', 'VAL', 'CDN', 'NMR', 'ROL']
  for (const code of codes) {
    try {
      store.catalogos[code] = await readJson(`${base}/${code}.json`)
    } catch {
      store.catalogos[code] = []
    }
  }
}

async function loadData() {
  store.mapeosLinea = await readJson('api/mapeos/linea.json')
  store.mapeosCampana = await readJson('api/mapeos/campana.json')
  store.columnasLinea = await readJson('api/columnas/linea.json')
  store.columnasCampana = await readJson('api/columnas/campana.json')
  await loadCatalogos()
}

function send(res, status, data) {
  const payload = data === undefined ? '' : JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Suppress-Toast'
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

function findMapeoLinea(id) {
  return store.mapeosLinea.find(m => Number(m.idABCConfigMapeoLinea) === Number(id))
}

function findMapeoCampana(id) {
  return store.mapeosCampana.find(m => Number(m.idABCConfigMapeoLinea) === Number(id))
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
  return {
    idABCConfigMapeoLinea: Number(mapeoId),
    idABCCatColumna: columnaId,
    bolActivo: payload?.columna?.bolActivo ?? true,
    regex: payload?.columna?.regex ?? null,
    obligatorio: payload?.columna?.obligatorio ?? null,
    valor: payload?.columna?.valor ?? null,
    fechaCreacion: now(),
    fechaUltimaModificacion: now()
  }
}

function buildColumnaCampanaRecord(mapeoId, payload) {
  const columnaId = Number(payload?.columna?.tipo?.id ?? payload?.columnaId ?? 0)
  return {
    idABCConfigMapeoCampana: Number(mapeoId),
    idABCCatColumna: columnaId,
    bolActivo: payload?.columna?.bolActivo ?? true,
    regex: payload?.columna?.regex ?? null,
    obligatorio: payload?.columna?.obligatorio ?? null,
    valor: payload?.columna?.valor ?? null,
    fechaCreacion: now(),
    fechaUltimaModificacion: now()
  }
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
    columnas: store.columnasCampana.filter(c => Number(c.idABCConfigMapeoCampana) === Number(m.idABCConfigMapeoLinea)).length
  }))
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204)

    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    const pathname = url.pathname

    if (!pathname.startsWith(API_PREFIX)) {
      return send(res, 404, { message: 'Not found' })
    }

    const pathOnly = pathname.slice(API_PREFIX.length)

    if (req.method === 'GET') {
      const catalogoParams = matchPath(pathOnly, '/catalogos/:codigo')
      if (catalogoParams) {
        const code = String(catalogoParams.codigo || '').toUpperCase()
        const list = store.catalogos[code] || []
        return send(res, 200, list)
      }

      if (pathOnly === '/lineas/mapeos') {
        return send(res, 200, withColumnCounts(store.mapeosLinea, 'linea'))
      }

      const lineasMapeoParams = matchPath(pathOnly, '/lineas/:lineaId/mapeos')
      if (lineasMapeoParams) {
        const lineaId = Number(lineasMapeoParams.lineaId)
        const list = store.mapeosLinea.filter(m => Number(m.idABCCatLineaNegocio) === lineaId)
        return send(res, 200, withColumnCounts(list, 'linea'))
      }

      if (pathOnly === '/lineas/campanas/mapeos') {
        return send(res, 200, withColumnCounts(store.mapeosCampana, 'campana'))
      }

      const columnasLineaParams = matchPath(pathOnly, '/lineas/mapeos/:mapeoId/columnas')
      if (columnasLineaParams) {
        const mapeoId = Number(columnasLineaParams.mapeoId)
        const list = store.columnasLinea.filter(c => Number(c.idABCConfigMapeoLinea) === mapeoId)
        return send(res, 200, list)
      }

      if (pathOnly === '/lineas/mapeos/0/columnas') {
        return send(res, 200, store.columnasLinea)
      }

      const columnasCampanaParams = matchPath(pathOnly, '/campanas/mapeos/:mapeoId/columnas')
      if (columnasCampanaParams) {
        const mapeoId = Number(columnasCampanaParams.mapeoId)
        const list = store.columnasCampana.filter(c => Number(c.idABCConfigMapeoCampana) === mapeoId)
        return send(res, 200, list)
      }

      if (pathOnly === '/campanas/mapeos/0/columnas') {
        return send(res, 200, store.columnasCampana)
      }
    }

    if (req.method === 'POST') {
      const lineasCreateParams = matchPath(pathOnly, '/lineas/:lineaId/mapeos')
      if (lineasCreateParams) {
        const body = await parseBody(req)
        const lineaId = Number(lineasCreateParams.lineaId)
        const next = nextId(store.mapeosLinea, 'idABCConfigMapeoLinea')
        const base = body.mapeo ?? body
        const record = {
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
        }
        store.mapeosLinea.push(record)
        return send(res, 200, record)
      }

      const campanaCreateParams = matchPath(pathOnly, '/lineas/:lineaId/campanas/:campanaId/mapeos')
      if (campanaCreateParams) {
        const body = await parseBody(req)
        const lineaId = Number(campanaCreateParams.lineaId)
        const campanaId = Number(campanaCreateParams.campanaId)
        const next = nextId(store.mapeosCampana, 'idABCConfigMapeoLinea')
        const base = body.mapeo ?? body
        const record = {
          idABCConfigMapeoLinea: next,
          idABCCatLineaNegocio: Number(base.idABCCatLineaNegocio ?? lineaId),
          idABCCatCampana: Number(base.idABCCatCampana ?? campanaId),
          idABCUsuario: Number(body.idUsuario ?? body.idABCUsuario ?? 1),
          nombre: base.nombre ?? `Mapeo Campana ${next}`,
          descripcion: base.descripcion ?? '',
          bolActivo: base.bolActivo ?? true,
          validar: base.validar ?? false,
          envio: base.envio ?? false,
          columnas: 0,
          fechaCreacion: now(),
          fechaUltimaModificacion: now()
        }
        store.mapeosCampana.push(record)
        return send(res, 200, record)
      }

      const columnasLineaCreate = matchPath(pathOnly, '/lineas/mapeos/:mapeoId/columnas')
      if (columnasLineaCreate) {
        const body = await parseBody(req)
        const record = buildColumnaLineaRecord(columnasLineaCreate.mapeoId, body)
        store.columnasLinea.push(record)
        return send(res, 200, record)
      }

      const columnasCampanaCreate = matchPath(pathOnly, '/campanas/mapeos/:mapeoId/columnas')
      if (columnasCampanaCreate) {
        const body = await parseBody(req)
        const record = buildColumnaCampanaRecord(columnasCampanaCreate.mapeoId, body)
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
        Object.assign(current, payload, { fechaUltimaModificacion: now() })
        return send(res, 200, current)
      }

      if (pathOnly === '/lineas/campanas/mapeos') {
        const body = await parseBody(req)
        const payload = body.mapeo ?? body
        const id = Number(payload.id ?? payload.idABCConfigMapeoLinea)
        const current = findMapeoCampana(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        Object.assign(current, payload, { fechaUltimaModificacion: now() })
        return send(res, 200, current)
      }

      const columnasLineaUpdate = matchPath(pathOnly, '/lineas/mapeos/:mapeoId/columnas')
      if (columnasLineaUpdate) {
        const body = await parseBody(req)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId)
        const current = store.columnasLinea.find(c => Number(c.idABCConfigMapeoLinea) === Number(columnasLineaUpdate.mapeoId) && Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.regex = body?.columna?.regex ?? current.regex
        current.bolActivo = body?.columna?.bolActivo ?? current.bolActivo
        current.obligatorio = body?.columna?.obligatorio ?? current.obligatorio
        current.valor = body?.columna?.valor ?? current.valor
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
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId)
        const current = store.columnasCampana.find(c => Number(c.idABCConfigMapeoCampana) === Number(columnasCampanaUpdate.mapeoId) && Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.regex = body?.columna?.regex ?? current.regex
        current.bolActivo = body?.columna?.bolActivo ?? current.bolActivo
        current.obligatorio = body?.columna?.obligatorio ?? current.obligatorio
        current.valor = body?.columna?.valor ?? current.valor
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
        const id = Number(body?.mapeo?.id ?? body?.id)
        const current = findMapeoLinea(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = pathOnly.endsWith('/activar')
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      if (pathOnly === '/lineas/campanas/mapeos/activar' || pathOnly === '/lineas/campanas/mapeos/desactivar') {
        const body = await parseBody(req)
        const id = Number(body?.mapeo?.id ?? body?.id)
        const current = findMapeoCampana(id)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = pathOnly.endsWith('/activar')
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      const columnasLineaToggle = matchPath(pathOnly, '/lineas/mapeos/:mapeoId/columnas/:action')
      if (columnasLineaToggle && (columnasLineaToggle.action === 'activar' || columnasLineaToggle.action === 'desactivar')) {
        const body = await parseBody(req)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId ?? body?.id)
        const current = store.columnasLinea.find(c => Number(c.idABCConfigMapeoLinea) === Number(columnasLineaToggle.mapeoId) && Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = columnasLineaToggle.action === 'activar'
        current.fechaUltimaModificacion = now()
        return send(res, 200, current)
      }

      const columnasCampanaToggle = matchPath(pathOnly, '/campanas/mapeos/:mapeoId/columnas/:action')
      if (columnasCampanaToggle && (columnasCampanaToggle.action === 'activar' || columnasCampanaToggle.action === 'desactivar')) {
        const body = await parseBody(req)
        const columnaId = Number(body?.columna?.tipo?.id ?? body?.columnaId ?? body?.id)
        const current = store.columnasCampana.find(c => Number(c.idABCConfigMapeoCampana) === Number(columnasCampanaToggle.mapeoId) && Number(c.idABCCatColumna) === columnaId)
        if (!current) return send(res, 404, { message: 'Not found' })
        current.bolActivo = columnasCampanaToggle.action === 'activar'
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
