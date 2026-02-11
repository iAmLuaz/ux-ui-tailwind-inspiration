import type { MapeoCampanaData } from '@/types/mapeos/campana'
import { normalizeMapeoLinea } from '../linea/mapeoLinea.adapter'

export function normalizeMapeoCampana(item: any): MapeoCampanaData {
  const base = normalizeMapeoLinea(item) as MapeoCampanaData
  const campanaMapeoId = Number(
    item?.idABCConfigMapeoCampana ?? item?.id_mapeo_campana ?? item?.idCampanaMapeo ?? 0
  )
  if (campanaMapeoId) {
    base.idABCConfigMapeoLinea = campanaMapeoId
  }
  base.idABCCatCampana = Number(item?.idABCCatCampana ?? item?.id_campana ?? 0)
  return base
}

export function normalizeMapeosCampana(data: any): MapeoCampanaData[] {
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.map(normalizeMapeoCampana)
}
