import { api } from '../api'
import type {
  CatalogoCodigo,
  CatalogoGrupo,
  CatalogoItem,
  CatalogosGroupedResponse
} from '../../types/catalogos/catalogos'

interface ApiClient {
  getCatalogos(): Promise<CatalogosGroupedResponse | CatalogoItem[]>
}

const apiClient = api as ApiClient

const KNOWN_CODIGOS = new Set(['ROL', 'LNN', 'CMP', 'CLM', 'VAL', 'CDN', 'NMR', 'DIA', 'HRS', 'EJE', 'ACT'])

function normalizeCatalogText(value: any): string {
  const clean = String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.replace(/\bCOSTUMER\b/gi, 'CUSTOMER')
}

function normalizeCatalogo(item: any): CatalogoItem {
  const rawActivo = item?.bolActivo ?? item?.status
  const rawActivoStr = String(rawActivo ?? '').trim().toLowerCase()
  const bolActivo = typeof rawActivo === 'boolean'
    ? rawActivo
    : rawActivo === undefined || rawActivo === null || rawActivo === ''
      ? true
      : rawActivoStr === 'true'
        ? true
        : rawActivoStr === 'false'
          ? false
      : Number(rawActivo) === 1

  return {
    id: Number(item?.id ?? item?.idCatalogo ?? 0),
    bolActivo,
    codigo: normalizeCatalogText(item?.codigo),
    nombre: normalizeCatalogText(item?.nombre),
    fechaCreacion: String(item?.fechaCreacion ?? item?.fecCreacion ?? item?.fec_creacion ?? ''),
    fechaUltimaModificacion: String(item?.fechaUltimaModificacion ?? item?.fecUltModificacion ?? item?.fec_ult_modificacion ?? '')
  }
}

function normalizeCatalogoCodigo(value: any): string {
  return normalizeCatalogText(value).toUpperCase()
}

function inferCodigoFromName(value: any): string {
  const name = normalizeCatalogoCodigo(value)
  if (!name) return ''
  if (name.includes('LINEA')) return 'LNN'
  if (name.includes('CAMP')) return 'CMP'
  if (name.includes('COLUMN')) return 'CLM'
  if (name.includes('VAL')) return 'VAL'
  if (name.includes('CADENA')) return 'CDN'
  if (name.includes('NUMER')) return 'NMR'
  if (name.includes('ROL')) return 'ROL'
  if (name.includes('DIA')) return 'DIA'
  if (name.includes('HORA')) return 'HRS'
  if (name.includes('EJECU')) return 'EJE'
  if (name.includes('ACTIV')) return 'ACT'
  return ''
}

function inferCodigoFromItem(item: any): string {
  const direct =
    item?.catalogoCodigo
    ?? item?.codigoCatalogo
    ?? item?.codCatalogo
    ?? item?.catalogo
    ?? item?.tipoCatalogo
    ?? item?.catalogoTipo
    ?? item?.grupo
    ?? item?.grupoCodigo
    ?? item?.codigoGrupo
    ?? item?.catalogoPadre?.codigo
    ?? item?.catalogoPadreCodigo
    ?? item?.cat?.codigo

  const normalized = normalizeCatalogoCodigo(direct)
  if (KNOWN_CODIGOS.has(normalized)) return normalized

  const fromNombre =
    inferCodigoFromName(item?.nombreCatalogo)
    || inferCodigoFromName(item?.catalogoNombre)
    || inferCodigoFromName(item?.nombre)
    || inferCodigoFromName(item?.catalogo)

  if (KNOWN_CODIGOS.has(fromNombre)) return fromNombre
  return 'GEN'
}

function readGroupedList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []

  const candidateKeys = ['data', 'catalogos', 'items', 'result', 'resultado', 'value', 'values']
  for (const key of candidateKeys) {
    if (Array.isArray(payload?.[key])) return payload[key]
  }

  const objectEntries = Object.entries(payload)
  const hasKnownCodeKeys = objectEntries.some(([key, value]) => KNOWN_CODIGOS.has(String(key).toUpperCase()) && Array.isArray(value))
  if (hasKnownCodeKeys) {
    return objectEntries
      .filter(([key, value]) => KNOWN_CODIGOS.has(String(key).toUpperCase()) && Array.isArray(value))
      .map(([key, value]) => ({ codigo: String(key).toUpperCase(), nombre: String(key).toUpperCase(), registros: value }))
  }

  return []
}

function groupFlatItems(records: any[]): CatalogoGrupo[] {
  const buckets = new Map<string, CatalogoItem[]>()

  for (const record of records) {
    const code = inferCodigoFromItem(record)
    if (!buckets.has(code)) buckets.set(code, [])
    buckets.get(code)!.push(normalizeCatalogo(record))
  }

  return Array.from(buckets.entries()).map(([codigo, registros]) => ({
    codigo,
    nombre: codigo,
    registros
  }))
}

function normalizeCatalogosPayload(payload: any): CatalogoGrupo[] {
  const list = readGroupedList(payload)

  if (!list.length) return []

  const looksGrouped = list.some((entry: any) =>
    Array.isArray(entry?.registros)
    || Array.isArray(entry?.items)
    || Array.isArray(entry?.catalogos)
    || Array.isArray(entry?.valores)
  )

  if (!looksGrouped) {
    return groupFlatItems(list)
  }

  return list.map((group: any) => {
    let registros =
      (Array.isArray(group?.registros) && group.registros)
      || (Array.isArray(group?.items) && group.items)
      || (Array.isArray(group?.catalogos) && group.catalogos)
      || (Array.isArray(group?.valores) && group.valores)
      || []

    if (registros.length === 1 && Array.isArray(registros[0])) registros = registros[0]

    const codigo = normalizeCatalogoCodigo(
      group?.codigo
      ?? group?.catalogoCodigo
      ?? inferCodigoFromName(group?.nombre)
      ?? inferCodigoFromName(group?.catalogoNombre)
      ?? inferCodigoFromItem(group)
    )

    return {
      codigo: codigo || 'GEN',
      nombre: normalizeCatalogText(group?.nombre ?? group?.catalogoNombre ?? codigo),
      registros: registros.map(normalizeCatalogo)
    }
  })
}

function fetchGroupedCatalogos(forceRefresh = false): Promise<CatalogoGrupo[]> {
  void forceRefresh
  return apiClient.getCatalogos().then(payload => normalizeCatalogosPayload(payload))
}

export const catalogosService = {
  getCatalogos(codigo?: CatalogoCodigo | string) {
    return fetchGroupedCatalogos().then(grouped => {
      if (!codigo) {
        return grouped.flatMap(group => group.registros)
      }

      const selected = grouped.find(
        group => normalizeCatalogoCodigo(group.codigo) === normalizeCatalogoCodigo(codigo)
      )
      return selected?.registros ?? []
    })
  },

  getCatalogosAgrupados(forceRefresh = false) {
    return fetchGroupedCatalogos(forceRefresh)
  }
}
