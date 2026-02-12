export function delay(ms: number = 10): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

const noopLog = () => {}

export const mockCatalogosApi = {
	async getCatalogos(codigo: string | unknown): Promise<any[]> {
		await delay()
		noopLog()
		const now = new Date()
		const makeDate = (i: number) => new Date(now.getTime() - i * 86400000).toISOString()

		const lineas = Array.from({ length: 20 }).map((_, i) => ({
			id: i + 1,
			bolActivo: true,
			codigo: `LNN-${String(i + 1).padStart(2, '0')}`,
			nombre: `Línea ${i + 1}`,
			fecCreacion: makeDate(i + 1),
			fecUltModificacion: makeDate(i)
		}))

		const campanas = Array.from({ length: 20 }).map((_, i) => ({
			id: i + 101,
			bolActivo: i % 5 !== 0,
			codigo: `CMP-${String(i + 1).padStart(2, '0')}`,
			nombre: `Campaña ${i + 1}`,
			fecCreacion: makeDate(i + 2),
			fecUltModificacion: makeDate(i)
		}))

		if (String(codigo).toUpperCase().includes('LNN')) return lineas
		if (String(codigo).toUpperCase().includes('CMP')) return campanas
		return [...lineas, ...campanas]
	}
}

export const mockApi = (() => {
	const now = new Date()
	const makeDate = (i: number) => new Date(now.getTime() - i * 86400000).toISOString()

	// seed data
	const mapeosLinea: any[] = Array.from({ length: 20 }).map((_, i) => ({
		idABCConfigMapeoLinea: i + 1,
		idABCCatLineaNegocio: (i % 10) + 1,
		nombre: `Mapeo Línea ${i + 1}`,
		descripcion: `Descripción del mapeo de línea ${i + 1}`,
		bolActivo: i % 4 !== 0,
		bolDictaminacion: null,
		fecCreacion: makeDate(i + 1),
		idABCUsuarioUltModificacion: 1,
		fecUltModificacion: makeDate(i)
	}))

	const mapeosCampana: any[] = Array.from({ length: 20 }).map((_, i) => ({
		idABCConfigMapeoCampana: i + 1001,
		idABCCatLineaNegocio: (i % 5) + 1,
		idABCCatCampana: 101 + i,
		nombre: `Mapeo Campaña ${i + 1}`,
		descripcion: `Descripción del mapeo de campaña ${i + 1}`,
		bolActivo: i % 3 !== 0,
		bolDictaminacion: null,
		fecCreacion: makeDate(i + 1),
		idABCUsuarioUltModificacion: 1,
		fecUltModificacion: makeDate(i)
	}))

	function nextLineaId() {
		return (mapeosLinea.reduce((a, b) => Math.max(a, Number(b.idABCConfigMapeoLinea || 0)), 0) || 0) + 1
	}

	function nextCampanaId() {
		return (mapeosCampana.reduce((a, b) => Math.max(a, Number(b.idABCConfigMapeoCampana || 0)), 0) || 1000) + 1
	}

	return {
		async getAllMapeos(): Promise<any[]> {
			await delay()
			return mapeosLinea.map(x => ({ ...x }))
		},

		async getMapeosByLinea(lineaId: string | number): Promise<any[]> {
			await delay()
			return mapeosLinea.filter(m => Number(m.idABCCatLineaNegocio) === Number(lineaId)).map(x => ({ ...x }))
		},

		async getMapeosCampana(): Promise<any[]> {
			await delay()
			return mapeosCampana.map(x => ({ ...x }))
		},

		async createMapeoLinea(lineaId: string | number, payload: any): Promise<any> {
			await delay()
			const id = nextLineaId()
			const data = payload?.mapeo ?? payload ?? {}
			const created = {
				idABCConfigMapeoLinea: id,
				idABCCatLineaNegocio: Number(lineaId),
				nombre: data.nombre ?? '',
				descripcion: data.descripcion ?? '',
				bolActivo: data.bolActivo === undefined ? true : Boolean(data.bolActivo),
				bolDictaminacion: data.bolDictaminacion ?? null,
				fecCreacion: new Date().toISOString(),
				idABCUsuarioUltModificacion: payload?.idUsuario ?? 1,
				fecUltModificacion: new Date().toISOString()
			}
			mapeosLinea.unshift(created)
			return { ...created }
		},

		async createMapeoCampana(lineaId: string | number, campanaId: string | number, payload: any): Promise<any> {
			await delay()
			const id = nextCampanaId()
			const data = payload?.mapeo ?? payload ?? {}
			const created = {
				idABCConfigMapeoCampana: id,
				idABCCatLineaNegocio: Number(lineaId),
				idABCCatCampana: Number(campanaId),
				nombre: data.nombre ?? '',
				descripcion: data.descripcion ?? '',
				bolActivo: data.bolActivo === undefined ? true : Boolean(data.bolActivo),
				bolDictaminacion: data.bolDictaminacion ?? null,
				fecCreacion: new Date().toISOString(),
				idABCUsuarioUltModificacion: payload?.idUsuario ?? 1,
				fecUltModificacion: new Date().toISOString()
			}
			mapeosCampana.unshift(created)
			return { ...created }
		},

		async updateMapeoLinea(payload: any): Promise<any> {
			await delay()
			const data = payload?.mapeo ?? payload ?? {}
			const id = Number(data?.id ?? data?.idABCConfigMapeoLinea ?? 0)
			const idx = mapeosLinea.findIndex(m => Number(m.idABCConfigMapeoLinea) === id)
			if (idx === -1) return {}
			mapeosLinea[idx] = {
				...mapeosLinea[idx],
				nombre: data.nombre ?? mapeosLinea[idx].nombre,
				descripcion: data.descripcion ?? mapeosLinea[idx].descripcion,
				bolActivo: data.bolActivo === undefined ? mapeosLinea[idx].bolActivo : Boolean(data.bolActivo),
				fecUltModificacion: new Date().toISOString()
			}
			return { ...mapeosLinea[idx] }
		},

		async updateMapeoCampana(payload: any): Promise<any> {
			await delay()
			const data = payload?.mapeo ?? payload ?? {}
			const id = Number(data?.id ?? data?.idABCConfigMapeoCampana ?? 0)
			const idx = mapeosCampana.findIndex(m => Number(m.idABCConfigMapeoCampana) === id)
			if (idx === -1) return {}
			mapeosCampana[idx] = {
				...mapeosCampana[idx],
				nombre: data.nombre ?? mapeosCampana[idx].nombre,
				descripcion: data.descripcion ?? mapeosCampana[idx].descripcion,
				bolActivo: data.bolActivo === undefined ? mapeosCampana[idx].bolActivo : Boolean(data.bolActivo),
				fecUltModificacion: new Date().toISOString()
			}
			return { ...mapeosCampana[idx] }
		},

		async deleteMapeoLinea(lineaId: string | number, mapeoId: string | number): Promise<void> {
			await delay()
			for (let i = mapeosLinea.length - 1; i >= 0; i--) {
				if (Number(mapeosLinea[i].idABCConfigMapeoLinea) === Number(mapeoId) && Number(mapeosLinea[i].idABCCatLineaNegocio) === Number(lineaId)) {
					mapeosLinea.splice(i, 1)
				}
			}
			return
		},

		async patchActivarMapeoLinea(payload: any): Promise<any> {
			await delay()
			const id = Number(payload?.mapeo?.id ?? 0)
			const item = mapeosLinea.find(m => Number(m.idABCConfigMapeoLinea) === id)
			if (!item) return {}
			item.bolActivo = true
			item.fecUltModificacion = new Date().toISOString()
			return { ...item }
		},

		async patchDesactivarMapeoLinea(payload: any): Promise<any> {
			await delay()
			const id = Number(payload?.mapeo?.id ?? 0)
			const item = mapeosLinea.find(m => Number(m.idABCConfigMapeoLinea) === id)
			if (!item) return {}
			item.bolActivo = false
			item.fecUltModificacion = new Date().toISOString()
			return { ...item }
		},

		async patchActivarMapeoCampana(payload: any): Promise<any> {
			await delay()
			const id = Number(payload?.mapeo?.id ?? 0)
			const item = mapeosCampana.find(m => Number(m.idABCConfigMapeoCampana) === id)
			if (!item) return {}
			item.bolActivo = true
			item.fecUltModificacion = new Date().toISOString()
			return { ...item }
		},

		async patchDesactivarMapeoCampana(payload: any): Promise<any> {
			await delay()
			const id = Number(payload?.mapeo?.id ?? 0)
			const item = mapeosCampana.find(m => Number(m.idABCConfigMapeoCampana) === id)
			if (!item) return {}
			item.bolActivo = false
			item.fecUltModificacion = new Date().toISOString()
			return { ...item }
		},

		async postBitacoraUsuario(_payload: any): Promise<any> { await delay(); return { ok: true } }
	}
})()

export const mockColumnasApi = {
	async getColumnasByMapeo(_mapeoId: string | number): Promise<any[]> { await delay();
		const now = new Date()
		const makeDate = (i: number) => new Date(now.getTime() - i * 86400000).toISOString()
		return Array.from({ length: 20 }).map((_, i) => ({
			idABCConfigMapeoLinea: Number(_mapeoId) || (i + 1),
			idABCCatColumna: i + 1,
			bolActivo: i % 5 !== 0,
			bolCarga: true,
			bolValidacion: i % 2 === 0,
			bolEnvio: i % 3 === 0,
			regex: `^valor_${i + 1}$`,
			fecCreacion: makeDate(i + 1),
			idABCUsuarioUltModificacion: 1,
			fecUltModificacion: makeDate(i)
		})) },
	async getColumnasLinea(): Promise<any[]> { await delay();
		const now = new Date()
		const makeDate = (i: number) => new Date(now.getTime() - i * 86400000).toISOString()
		return Array.from({ length: 20 }).map((_, i) => ({
			idABCConfigMapeoLinea: i + 1,
			idABCCatColumna: i + 1,
			bolActivo: true,
			bolCarga: true,
			bolValidacion: i % 2 === 0,
			bolEnvio: i % 3 === 0,
			regex: `^linea_col_${i + 1}$`,
			fecCreacion: makeDate(i + 1),
			idABCUsuarioUltModificacion: 1,
			fecUltModificacion: makeDate(i)
		})) },
	async getColumnasCampana(): Promise<any[]> { await delay();
		const now = new Date()
		const makeDate = (i: number) => new Date(now.getTime() - i * 86400000).toISOString()
		return Array.from({ length: 20 }).map((_, i) => ({
			idABCConfigMapeoCampana: i + 1001,
			idABCCatColumna: i + 1,
			idABCCatCampana: 101 + (i % 20),
			bolActivo: i % 4 !== 0,
			bolCarga: true,
			bolValidacion: i % 2 === 0,
			bolEnvio: i % 3 === 0,
			regex: `^camp_col_${i + 1}$`,
			fecCreacion: makeDate(i + 1),
			idABCUsuarioUltModificacion: 1,
			fecUltModificacion: makeDate(i)
		})) },
	async getColumnasCampanaByMapeo(_mapeoId: string | number): Promise<any[]> { await delay();
		const now = new Date()
		const makeDate = (i: number) => new Date(now.getTime() - i * 86400000).toISOString()
		return Array.from({ length: 20 }).map((_, i) => ({
			idABCConfigMapeoCampana: Number(_mapeoId) || (i + 1001),
			idABCCatColumna: i + 1,
			idABCCatCampana: 101 + (i % 20),
			bolActivo: i % 4 !== 0,
			bolCarga: true,
			bolValidacion: i % 2 === 0,
			bolEnvio: i % 3 === 0,
			regex: `^camp_map_col_${i + 1}$`,
			fecCreacion: makeDate(i + 1),
			idABCUsuarioUltModificacion: 1,
			fecUltModificacion: makeDate(i)
		})) },
	async createColumnaCampanaGlobal(_payload: any): Promise<any> { await delay(); return {} },
	async createColumnaLinea(_mapeoId: string | number, _payload: any): Promise<any> { await delay(); return {} },
	async updateColumnaLinea(_payload: any): Promise<any> { await delay(); return {} },
	async patchActivarColumnaLinea(_payload: any): Promise<any> { await delay(); return {} },
	async patchDesactivarColumnaLinea(_payload: any): Promise<any> { await delay(); return {} },
	async createColumnaCampana(_mapeoId: string | number, _payload: any): Promise<any> { await delay(); return {} },
	async updateColumnaCampana(_payload: any): Promise<any> { await delay(); return {} },
	async patchActivarColumnaCampana(_payload: any): Promise<any> { await delay(); return {} },
	async patchDesactivarColumnaCampana(_payload: any): Promise<any> { await delay(); return {} },
	async postBitacoraUsuario(_payload: any): Promise<any> { await delay(); return { ok: true } }
}

