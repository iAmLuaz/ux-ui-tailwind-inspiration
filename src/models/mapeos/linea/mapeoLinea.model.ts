import type {
  CreateMapeoLineaPayload,
  UpdateMapeoLineaPayload
} from '@/types/mapeos/linea'

export interface MapeoLineaFormModel {
  idABCCatLineaNegocio?: number | ''
  nombre: string
  descripcion: string
  validar?: boolean
  enviar?: boolean
  idUsuario?: number | ''
}

export function toCreateMapeoLineaPayload(form: MapeoLineaFormModel): CreateMapeoLineaPayload {
  return {
    mapeo: {
      nombre: form.nombre,
      descripcion: form.descripcion,
      validar: form.validar,
      enviar: form.enviar
    },
    idABCUsuario: Number(form.idUsuario ?? 1),
    idUsuario: form.idUsuario === '' ? undefined : Number(form.idUsuario ?? 1)
  }
}

export function toUpdateMapeoLineaPayload(
  form: MapeoLineaFormModel,
  mapeoId: number
): UpdateMapeoLineaPayload {
  return {
    mapeo: {
      id: mapeoId,
      nombre: form.nombre,
      descripcion: form.descripcion,
      validar: form.validar,
      enviar: form.enviar
    },
    idUsuario: Number(form.idUsuario ?? 1)
  }
}
