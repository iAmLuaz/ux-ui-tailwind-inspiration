import type { ColumnaCampanaModel } from '@/models/columnaCampana.model'
import type { ColumnaCampanaData } from '@/types/columna'

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null ? v as Record<string, unknown> : {}
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function normalizeRegex(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function toBoolean(v: unknown): boolean {
  return Boolean(v)
}

function normalizeObligatorio(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  if (v === 1 || v === 0) return Boolean(v)
  return null
}

function adaptValor(raw: unknown) {
  const r = asRecord(raw)
  if (Object.keys(r).length === 0) return null

  const tipoId = toNumber((r.tipo as Record<string, unknown>)?.id ?? (r.tipo as Record<string, unknown>)?.idABCCatColumna ?? r.id)
  const tipo = tipoId !== null ? { id: tipoId } : null

  const cadenaRaw = r.cadena as Record<string, unknown> | undefined
  const numeroRaw = r.numero as Record<string, unknown> | undefined

  const cadena = cadenaRaw ? {
    tipo: ((): { id: number } | null => {
      const id = toNumber((cadenaRaw.tipo as Record<string, unknown>)?.id ?? (cadenaRaw.tipo as Record<string, unknown>)?.idABCCatColumna ?? cadenaRaw.id)
      return id !== null ? { id } : null
    })(),
    minimo: toNumber(cadenaRaw.minimo) ?? null,
    maximo: toNumber(cadenaRaw.maximo) ?? null
  } : null

  const numero = numeroRaw ? {
    tipo: ((): { id: number } | null => {
      const id = toNumber((numeroRaw.tipo as Record<string, unknown>)?.id ?? (numeroRaw.tipo as Record<string, unknown>)?.idABCCatColumna ?? numeroRaw.id)
      return id !== null ? { id } : null
    })(),
    enteros: toNumber(numeroRaw.enteros) ?? null,
    decimales: toNumber(numeroRaw.decimales) ?? null
  } : null

  return {
    tipo,
    cadena,
    numero
  }
}

export function adaptColumnaCampana(
  raw: ColumnaCampanaData
): ColumnaCampanaModel {
  const r = asRecord(raw)
  const columnaRec = asRecord(r.columna)
  const llave = asRecord(r.llaveMapeoCampanaColumna)

  const mapeoId = toNumber(columnaRec.idABCConfigMapeoCampana ?? llave.idABCConfigMapeoCampana ?? r.idABCConfigMapeoCampana) ?? 0
  const tipoRec = (columnaRec.tipo as Record<string, unknown>) ?? {}
  const columnaId = toNumber(tipoRec.id ?? tipoRec.idABCCatColumna ?? llave.idABCCatColumna ?? r.idABCCatColumna) ?? 0

  const valor = adaptValor(columnaRec.valor ?? r.valor ?? null)

  return {
    tipo: 'campana',
    mapeoId,
    columnaId,
    bolActivo: toBoolean(r.bolActivo ?? columnaRec.bolActivo ?? false),
    regex: normalizeRegex(columnaRec.regex ?? r.regex ?? null),
    obligatorio: normalizeObligatorio(columnaRec.obligatorio ?? columnaRec.obligatoria ?? r.obligatorio ?? null),
    valor: valor,
    idUsuario: toNumber(r.idUsuario ?? columnaRec.idUsuario ?? null),
    columna: {
      tipo: { id: columnaId ?? undefined, idABCCatColumna: columnaId ?? undefined },
      bolActivo: toBoolean(columnaRec.bolActivo ?? undefined),
      obligatorio: normalizeObligatorio(columnaRec.obligatorio ?? columnaRec.obligatoria ?? undefined),
      regex: normalizeRegex(columnaRec.regex ?? undefined),
      valor: valor
    },
    fechaCreacion: typeof columnaRec.fechaCreacion === 'string' ? columnaRec.fechaCreacion : (typeof r.fechaCreacion === 'string' ? r.fechaCreacion : undefined),
    fechaUltimaModificacion: typeof columnaRec.fechaUltimaModificacion === 'string' ? columnaRec.fechaUltimaModificacion : (typeof r.fechaUltimaModificacion === 'string' ? r.fechaUltimaModificacion : undefined)
  }
}