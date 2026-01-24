import type { ColumnaLineaModel } from '@/models/columnaLinea.model'

export function adaptColumnasLinea(raw: any[]): ColumnaLineaModel[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter(item => item && typeof item === 'object')
    .map(item => ({
        tipo: 'linea',
        mapeoId: Number(item.idABCConfigMapeoLinea),
        columnaId: Number(item.idABCCatColumna),
        bolActivo: !!item.bolActivo,
        bolCarga: !!item.bolCarga,
        bolValidacion: !!item.bolValidacion,
        bolEnvio: !!item.bolEnvio,
        regex: item.regex ?? '',
        fecCreacion: item.fecCreacion,
        fecUltModificacion: item.fecUltModificacion
    }))
}
