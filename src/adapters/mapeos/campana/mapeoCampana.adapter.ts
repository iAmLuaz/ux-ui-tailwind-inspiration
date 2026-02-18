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
  const campanaId = Number(item?.linea?.campana?.id ?? item?.idABCCatCampana ?? item?.id_campana ?? 0)
  base.linea = {
    id: Number(base.linea?.id ?? item?.linea?.id ?? item?.idABCCatLineaNegocio ?? 0),
    campana: campanaId ? { id: campanaId } : null
  }
  base.idABCCatLineaNegocio = base.linea.id
  base.idABCCatCampana = campanaId
  return base
}

export function normalizeMapeosCampana(data: any): MapeoCampanaData[] {
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.map(normalizeMapeoCampana)
}
