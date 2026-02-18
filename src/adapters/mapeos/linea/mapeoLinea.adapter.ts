import type { MapeoLineaData } from '@/types/mapeos/linea'

export function normalizeMapeoLinea(item: any): MapeoLineaData {
  const rawActivo = item?.bolActivo ?? item?.status ?? false
  const rawDictaminacion = item?.bolDictaminacion ?? item?.dictaminacion
  const rawValidar = item?.validar ?? item?.bolValidacion ?? item?.validar_flag
  const rawEnviar = item?.enviar ?? item?.envio ?? item?.bolEnvio ?? item?.envio_flag

  const lineaId = Number(
    item?.linea?.id ?? item?.idABCCatLineaNegocio ?? item?.id_linea ?? item?.idLinea ?? 0
  )
  const campanaIdRaw = item?.linea?.campana?.id ?? item?.idABCCatCampana ?? item?.id_campana
  const campanaId =
    campanaIdRaw === null || campanaIdRaw === undefined || Number.isNaN(Number(campanaIdRaw))
      ? null
      : Number(campanaIdRaw)

  const base: MapeoLineaData = {
    idABCConfigMapeoLinea: Number(
      item?.idABCConfigMapeoLinea ?? item?.id ?? item?.id_mapeo ?? 0
    ),
    linea: {
      id: lineaId,
      campana: campanaId !== null ? { id: campanaId } : null
    },
    idABCCatLineaNegocio: lineaId,
    idABCUsuario: Number(item?.idABCUsuario ?? item?.id_usuario ?? 1),
    nombre: item?.nombre ?? '',
    descripcion: item?.descripcion ?? '',
    bolActivo: typeof rawActivo === 'boolean' ? rawActivo : Number(rawActivo) === 1,
    bolDictaminacion:
      rawDictaminacion === null || rawDictaminacion === undefined
        ? null
        : Boolean(rawDictaminacion),
    validar: typeof rawValidar === 'boolean'
      ? rawValidar
      : (rawValidar === undefined ? undefined : Number(rawValidar) === 1),
    enviar: typeof rawEnviar === 'boolean'
      ? rawEnviar
      : (rawEnviar === undefined ? undefined : Number(rawEnviar) === 1),
    fechaCreacion: item?.fechaCreacion ?? item?.fec_creacion ?? item?.created_at ?? '',
    fechaUltimaModificacion:
      item?.fechaUltimaModificacion ?? item?.fec_ult_modificacion ?? item?.updated_at ?? ''
  }

  if (Array.isArray(item?.columnas)) {
    ;(base as any).columnas = item.columnas
  } else if (typeof item?.columnas === 'number') {
    ;(base as any).columnas = Number(item.columnas)
  } else if (typeof item?.columnas === 'string' && !Number.isNaN(Number(item.columnas))) {
    ;(base as any).columnas = Number(item.columnas)
  }

  return base
}

export function normalizeMapeosLinea(data: any): MapeoLineaData[] {
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.map(normalizeMapeoLinea)
}
