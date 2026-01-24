import type { ColumnaCampanaModel } from '@/models/columnaCampana.model'
import type { ColumnaCampanaData } from '@/types/columna'

export function adaptColumnaCampana(
  raw: ColumnaCampanaData
): ColumnaCampanaModel {
  return {
    mapeoId: raw.idABCConfigMapeoCampana,
    columnaId: raw.idABCCatColumna,
    bolActivo: raw.bolActivo,
    bolCarga: raw.bolCarga,
    bolValidacion: raw.bolValidacion,
    bolEnvio: raw.bolEnvio,
    regex: raw.regex ?? '',
    fecCreacion: raw.fecCreacion,
    fecUltModificacion: raw.fecUltModificacion
  }
}
