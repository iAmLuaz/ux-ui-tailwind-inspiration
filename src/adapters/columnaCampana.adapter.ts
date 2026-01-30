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

export function adaptColumnaCampana(
  raw: ColumnaCampanaData
): ColumnaCampanaModel {
  const r = asRecord(raw)
  const llave = asRecord(r.llaveMapeoCampanaColumna)

  const mapeoId = toNumber(llave.idABCConfigMapeoCampana ?? r.idABCConfigMapeoCampana) ?? 0
  const columnaId = toNumber(llave.idABCCatColumna ?? r.idABCCatColumna) ?? 0

  return {
    tipo: 'campana',
    mapeoId,
    columnaId,
    bolActivo: Boolean(r.bolActivo ?? false),
    regex: normalizeRegex(r.regex ?? null),
    columna: { tipo: { idABCCatColumna: columnaId } },
    fechaCreacion: typeof r.fechaCreacion === 'string' ? r.fechaCreacion : undefined,
    fechaUltimaModificacion: typeof r.fechaUltimaModificacion === 'string' ? r.fechaUltimaModificacion : undefined
  }
}