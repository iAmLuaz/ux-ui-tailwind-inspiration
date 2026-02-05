import type { ColumnaLineaModel, ColumnaValor, ColumnaValorCadena, ColumnaValorNumero } from '@/models/columnaLinea.model'

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null ? v as Record<string, unknown> : {}
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function toBoolean(v: unknown): boolean {
  return Boolean(v)
}

function normalizeRegex(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function normalizeObligatorio(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  if (v === 1 || v === 0) return Boolean(v)
  return null
}

function adaptValor(raw: unknown): ColumnaValor | null {
  const r = asRecord(raw)
  if (Object.keys(r).length === 0) return null

  const tipoId = toNumber((r.tipo as Record<string, unknown>)?.id ?? (r.tipo as Record<string, unknown>)?.idABCCatColumna ?? r.id)
  const tipo = tipoId !== null ? { id: tipoId } : null

  const cadenaRaw = r.cadena as Record<string, unknown> | undefined
  const numeroRaw = r.numero as Record<string, unknown> | undefined

  const cadena: ColumnaValorCadena | null = cadenaRaw ? {
    tipo: ((): { id: number } | null => {
      const id = toNumber((cadenaRaw.tipo as Record<string, unknown>)?.id ?? (cadenaRaw.tipo as Record<string, unknown>)?.idABCCatColumna ?? cadenaRaw.id)
      return id !== null ? { id } : null
    })(),
    minimo: toNumber(cadenaRaw.minimo) ?? null,
    maximo: toNumber(cadenaRaw.maximo) ?? null
  } : null

  const numero: ColumnaValorNumero | null = numeroRaw ? {
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

export function adaptColumnasLinea(raw: unknown): ColumnaLineaModel[] {
  if (!Array.isArray(raw)) return []

  const out: ColumnaLineaModel[] = []

  for (const item of raw) {
    const rec = asRecord(item)

    const columnaRec = asRecord(rec.columna)
    const llaveRec = asRecord(rec.llaveMapeoLineaColumna)

    const mapeoId = toNumber(columnaRec.idABCConfigMapeoLinea ?? llaveRec.idABCConfigMapeoLinea ?? rec.idABCConfigMapeoLinea)
    const tipoRec = (columnaRec.tipo as Record<string, unknown>) ?? {}
    const columnaId = toNumber(tipoRec.id ?? tipoRec.idABCCatColumna ?? llaveRec.idABCCatColumna ?? rec.idABCCatColumna)

    if (mapeoId === null || columnaId === null) continue

    const bolActivo = toBoolean(rec.bolActivo ?? columnaRec.bolActivo ?? false)
    const regex = normalizeRegex(columnaRec.regex ?? rec.regex ?? null)
    const obligatorio = normalizeObligatorio(columnaRec.obligatorio ?? columnaRec.obligatoria ?? rec.obligatorio ?? null)
    const valor = adaptValor(columnaRec.valor ?? null)

    out.push({
      tipo: 'linea',
      mapeoId,
      columnaId,
      bolActivo,
      regex,
      obligatorio,
      valor,
      idUsuario: toNumber(rec.idUsuario ?? columnaRec.idUsuario ?? null),
      columna: {
        tipo: { id: columnaId ?? undefined, idABCCatColumna: columnaId ?? undefined },
        bolActivo: toBoolean(columnaRec.bolActivo ?? undefined),
        obligatorio: normalizeObligatorio(columnaRec.obligatorio ?? columnaRec.obligatoria ?? undefined),
        regex: normalizeRegex(columnaRec.regex ?? undefined),
        valor: valor
      },
      fechaCreacion: typeof columnaRec.fechaCreacion === 'string' ? columnaRec.fechaCreacion : (typeof rec.fechaCreacion === 'string' ? rec.fechaCreacion : undefined),
      fechaUltimaModificacion: typeof columnaRec.fechaUltimaModificacion === 'string' ? columnaRec.fechaUltimaModificacion : (typeof rec.fechaUltimaModificacion === 'string' ? rec.fechaUltimaModificacion : undefined)
    })
  }

  return out
}