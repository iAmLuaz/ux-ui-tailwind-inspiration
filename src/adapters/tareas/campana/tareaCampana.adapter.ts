import type { TareaCampanaData } from '@/types/tareas/campana'

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  return Number(v ?? 0) === 1
}

export function normalizeTareaCampana(item: any): TareaCampanaData {
  const carga = item?.carga ?? {}
  const validacion = item?.validacion ?? {}
  const envio = item?.envio ?? {}
  return {
    idABCConfigTareaCampana: Number(item?.idABCConfigTareaCampana ?? item?.id ?? 0),
    idABCCatLineaNegocio: Number(item?.idABCCatLineaNegocio ?? item?.idLinea ?? 0),
    idABCCatCampana: Number(item?.idABCCatCampana ?? item?.idCampana ?? 0),
    ingesta: String(item?.ingesta ?? ''),
    carga: {
      ejecucion: String(carga?.ejecucion ?? item?.ejecucionIngesta ?? ''),
      dia: String(carga?.dia ?? item?.diaIngesta ?? ''),
      hora: String(carga?.hora ?? item?.horaIngesta ?? '')
    },
    validacion: {
      ejecucion: String(validacion?.ejecucion ?? item?.ejecucionValidacion ?? ''),
      dia: String(validacion?.dia ?? item?.diaValidacion ?? ''),
      hora: String(validacion?.hora ?? item?.horaValidacion ?? '')
    },
    envio: {
      ejecucion: String(envio?.ejecucion ?? item?.ejecucionEnvio ?? ''),
      dia: String(envio?.dia ?? item?.diaEnvio ?? ''),
      hora: String(envio?.hora ?? item?.horaEnvio ?? '')
    },
    bolActivo: toBool(item?.bolActivo ?? item?.status ?? false),
    fechaCreacion: String(item?.fechaCreacion ?? item?.fec_creacion ?? ''),
    fechaUltimaModificacion: String(item?.fechaUltimaModificacion ?? item?.fec_ult_modificacion ?? '')
  }
}

export function normalizeTareasCampana(data: any): TareaCampanaData[] {
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.map(normalizeTareaCampana)
}
