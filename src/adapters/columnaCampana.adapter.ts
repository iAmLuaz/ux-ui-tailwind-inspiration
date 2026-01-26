import type { ColumnaCampanaModel } from '@/models/columnaCampana.model'
import type { ColumnaCampanaData } from '@/types/columna'

export function adaptColumnaCampana(
  raw: ColumnaCampanaData
): ColumnaCampanaModel {
  return {
    mapeoId: Number(raw.llaveMapeoCampanaColumna?.idABCConfigMapeoCampana ?? raw.idABCConfigMapeoCampana),
    columnaId: Number(raw.llaveMapeoCampanaColumna?.idABCCatColumna ?? raw.idABCCatColumna),
    bolActivo: raw.bolActivo,
    bolCarga: raw.bolCarga,
    bolValidacion: raw.bolValidacion,
    bolEnvio: raw.bolEnvio,
    regex: raw.regex ?? '',
    fecCreacion: raw.fecCreacion,
    fecUltModificacion: raw.fecUltModificacion
  }
}
