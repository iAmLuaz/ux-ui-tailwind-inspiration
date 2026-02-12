import type { TareaLineaData } from '@/types/tareas/linea'

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  return Number(v ?? 0) === 1
}

export function normalizeTareaLinea(item: any): TareaLineaData {
  const carga = item?.carga ?? {}
  const validacion = item?.validacion ?? {}
  const envio = item?.envio ?? {}
  return {
    idABCConfigTareaLinea: Number(item?.idABCConfigTareaLinea ?? item?.id ?? 0),
    idABCCatLineaNegocio: Number(item?.idABCCatLineaNegocio ?? item?.idLinea ?? 0),
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

export function normalizeTareasLinea(data: any): TareaLineaData[] {
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.map(normalizeTareaLinea)
}
