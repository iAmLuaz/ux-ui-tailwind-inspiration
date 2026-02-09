export function delay(ms: number = 10): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export const noopLog = () => {}
export const mockCatalogosApi = {
	async getCatalogos(codigo: string | unknown): Promise<any[]> {
		await delay(40)
		const key = String(codigo ?? '').toUpperCase()
		const base = (id: number, codigo: string, nombre: string, activo = true) => ({ id, codigo, nombre, bolActivo: activo, fechaCreacion: now(), fechaUltimaModificacion: now() })
		switch (key) {
			case 'LNN': { 
				const items: any[] = []
				for (let i = 1; i <= 20; i++) {
					
					const activo = i % 5 !== 0
					items.push(base(i, `LNN_${i}`, `Línea ${i}`, activo))
				}
				return items
			}
			case 'CMP': 
				return [
					base(1, 'CMP_1', 'Campaña 1'),
					base(2, 'CMP_2', 'Campaña 2')
				]
			case 'ROL': 
				return [
					base(1, 'ROL_ADMIN', 'Administrador'),
					base(2, 'ROL_USER', 'Usuario')
				]
			case 'CLM': 
				return [
					base(1, 'CLM_A', 'Clase A'),
					base(2, 'CLM_B', 'Clase B')
				]
			default:
				
				return [
					base(1, String(codigo), `Catálogo ${String(codigo)}`)
				]
		}
	}
}

const now = () => new Date().toISOString()

let mapeos: any[] = []


for (let i = 1; i <= 20; i++) {
	if (i <= 12) {
		
		mapeos.push({
			id: i,
			tipo: 'linea',
			nombre: `Mapeo Línea ${i}`,
			idABCCatLineaNegocio: i,
			lineaId: i,
				bolActivo: i % 4 !== 0,
				validar: i % 2 === 0,
				envio: i % 3 === 0,
				idUsuario: 1,
			fechaCreacion: now(),
			fechaUltimaModificacion: now()
		})
	} else {
		
		const campanaId = i % 2 === 0 ? 2 : 1
		
		const lineaRef = ((i - 1) % 12) + 1
		mapeos.push({
			id: i,
			tipo: 'campana',
			nombre: `Mapeo Campaña ${i - 12}`,
			idABCCatLineaNegocio: lineaRef,
			idABCCatCampana: campanaId,
			lineaId: lineaRef,
			campanaId: campanaId,
				bolActivo: i % 3 !== 0,
				validar: i % 2 === 0,
				envio: i % 3 === 0,
				idUsuario: 1,
			fechaCreacion: now(),
			fechaUltimaModificacion: now()
		})
	}
}

let columnas: any[] = []


for (let cid = 1; cid <= 20; cid++) {
	if (cid % 3 !== 0) {
		
		const mapeoRef = ((cid - 1) % 12) + 1
		columnas.push({
			tipo: 'linea',
			mapeoId: mapeoRef,
			columnaId: cid,
			bolActivo: cid % 4 !== 0,
			regex: cid % 2 === 0 ? '^\\d+$' : '^\\w+$',
			fechaCreacion: now()
		})
	} else {
		
		const mapeoRef = 12 + (((cid - 1) % 8) + 1)
		columnas.push({
			mapeoId: mapeoRef,
			columnaId: cid,
			bolActivo: cid % 5 !== 0,
			regex: '^.{1,100}$',
			fechaCreacion: now()
		})
	}
}

export const mockApi = {
	async getAllMapeos(): Promise<any[]> { await delay(50); return mapeos.map(m => ({ ...m, columnas: columnas.filter(c => String(c.mapeoId) === String(m.id)) })) },
	async getMapeosByLinea(lineaId: string | number): Promise<any[]> { await delay(30); return mapeos.filter(m => m.tipo === 'linea' && String(m.lineaId) === String(lineaId)).map(m => ({ ...m, columnas: columnas.filter(c => String(c.mapeoId) === String(m.id)) })) },
	async getMapeosCampana(): Promise<any[]> { await delay(30); return mapeos.filter(m => m.tipo === 'campana').map(m => ({ ...m, columnas: columnas.filter(c => String(c.mapeoId) === String(m.id)) })) },
	async createMapeoLinea(_lineaId: string | number, payload: any): Promise<any> { 
			await delay(30);
			const id = mapeos.length ? Math.max(...mapeos.map(m => Number(m.id) || 0)) + 1 : 1;
			const nuevo = { id, tipo: 'linea', lineaId: Number(_lineaId), idABCCatLineaNegocio: payload.idABCCatLineaNegocio ?? Number(_lineaId), columnas: [], ...payload, fechaCreacion: now(), fechaUltimaModificacion: now() };
			mapeos.push(nuevo);
			return { ...nuevo } 
		},
		async createMapeoCampana(_lineaId: string | number, _campanaId: string | number, payload: any): Promise<any> { 
			await delay(30);
			const id = mapeos.length ? Math.max(...mapeos.map(m => Number(m.id) || 0)) + 1 : 1;
			const nuevo = { id, tipo: 'campana', lineaId: Number(_lineaId), campanaId: Number(_campanaId), idABCCatLineaNegocio: payload.idABCCatLineaNegocio ?? Number(_lineaId), idABCCatCampana: payload.idABCCatCampana ?? Number(_campanaId), columnas: [], ...payload, fechaCreacion: now(), fechaUltimaModificacion: now() };
			mapeos.push(nuevo);
			return { ...nuevo }
		},
		async updateMapeoLinea(payload: any): Promise<any> { 
			await delay(30);
			const idx = mapeos.findIndex(m => m.id === payload.id);
			if (idx === -1) throw new Error('Not found');
			mapeos[idx] = { ...mapeos[idx], ...payload, fechaUltimaModificacion: now() };
			return { ...mapeos[idx], columnas: columnas.filter(c => String(c.mapeoId) === String(mapeos[idx].id)) } 
		},
		async updateMapeoCampana(payload: any): Promise<any> { 
			await delay(30);
			const idx = mapeos.findIndex(m => m.id === payload.id);
			if (idx === -1) throw new Error('Not found');
			mapeos[idx] = { ...mapeos[idx], ...payload, fechaUltimaModificacion: now() };
			return { ...mapeos[idx], columnas: columnas.filter(c => String(c.mapeoId) === String(mapeos[idx].id)) }
		},
	async deleteMapeoLinea(_lineaId: string | number, _mapeoId: string | number): Promise<void> { await delay(30); mapeos = mapeos.filter(m => m.id !== Number(_mapeoId)) },
	async patchActivarMapeoLinea(payload: any): Promise<any> { await delay(20); const m = mapeos.find(x => x.id === payload.id); if (m) { m.bolActivo = true; m.fechaUltimaModificacion = now() } return m },
	async patchDesactivarMapeoLinea(payload: any): Promise<any> { await delay(20); const m = mapeos.find(x => x.id === payload.id); if (m) { m.bolActivo = false; m.fechaUltimaModificacion = now() } return m },
	async patchActivarMapeoCampana(payload: any): Promise<any> { await delay(20); const m = mapeos.find(x => x.id === payload.id); if (m) { m.bolActivo = true; m.fechaUltimaModificacion = now() } return m },
	async patchDesactivarMapeoCampana(payload: any): Promise<any> { await delay(20); const m = mapeos.find(x => x.id === payload.id); if (m) { m.bolActivo = false; m.fechaUltimaModificacion = now() } return m },
	async postBitacoraUsuario(_payload: any): Promise<any> { await delay(10); return { ok: true } }
}

	export const mockExamples = {
		createMapeosLinea: [
			{ nombre: 'Mapeo Línea Nuevo A', idABCCatLineaNegocio: 3, validar: true, envio: false, bolActivo: true, idUsuario: 2, columnas: [] },
			{ nombre: 'Mapeo Línea Nuevo B', idABCCatLineaNegocio: 5, validar: false, envio: true, bolActivo: true, idUsuario: 3, columnas: [] }
		],
		createMapeosCampana: [
			{ nombre: 'Mapeo Campaña Nuevo A', idABCCatLineaNegocio: 3, idABCCatCampana: 2, validar: true, envio: true, bolActivo: true, idUsuario: 2, columnas: [] },
			{ nombre: 'Mapeo Campaña Nuevo B', idABCCatLineaNegocio: 2, idABCCatCampana: 1, validar: false, envio: false, bolActivo: false, idUsuario: 2, columnas: [] }
		],
		updateMapeos: [
			{ id: 1, nombre: 'Mapeo Línea 1 - Editado (mock)', validar: false },
			{ id: 13, nombre: 'Mapeo Campaña 1 - Editado (mock)', envio: false }
		],
		createColumnasLinea: [
			{ columnaId: 301, bolActivo: true, regex: '^\\d{1,5}$' },
			{ columnaId: 302, bolActivo: false, regex: '^\\w{2,10}$' }
		],
		createColumnasCampana: [
			{ columnaId: 401, bolActivo: true, regex: '^.{1,50}$' }
		],
		updateColumnas: [
			{ mapeoId: 1, columnaId: 2, regex: '^\\w{1,10}$' },
			{ mapeoId: 13, columnaId: 101, bolActivo: false }
		]
	}

	export async function demoMockCRU(): Promise<any> {
		const createdLinea = await mockApi.createMapeoLinea(3, mockExamples.createMapeosLinea[0])
		const createdCampana = await mockApi.createMapeoCampana(3, 2, mockExamples.createMapeosCampana[0])

		const updatedLinea = await mockApi.updateMapeoLinea({ id: createdLinea.id ?? 0, nombre: `${createdLinea.nombre} - actualizado` })
		await mockApi.patchDesactivarMapeoLinea({ id: createdLinea.id })
		await mockApi.patchActivarMapeoCampana({ id: createdCampana.id })

		const nuevaCol = await mockColumnasApi.createColumnaLinea(createdLinea.id, mockExamples.createColumnasLinea[0])
		const columnasForCreated = await mockColumnasApi.getColumnasByMapeo(createdLinea.id)

		return { createdLinea, createdCampana, updatedLinea, nuevaCol, columnasForCreated }
	}

export const mockColumnasApi = {
		async getColumnasByMapeo(mapeoId: string | number): Promise<any[]> { await delay(30); return columnas.filter(c => String(c.mapeoId) === String(mapeoId)) },
	async getColumnasLinea(): Promise<any[]> { await delay(20); return columnas.filter(c => c.tipo === 'linea') },
	async getColumnasCampana(): Promise<any[]> { await delay(20); return columnas.filter(c => !c.tipo) },
	async getColumnasCampanaByMapeo(mapeoId: string | number): Promise<any[]> { await delay(20); return columnas.filter(c => String(c.mapeoId) === String(mapeoId) && !c.tipo) },
		async createColumnaCampanaGlobal(payload: any): Promise<any> { await delay(20); const nueva = { ...payload, fechaCreacion: now() }; columnas.push(nueva); return { ...nueva } },
		async createColumnaLinea(mapeoId: string | number, payload: any): Promise<any> { 
			await delay(20);
			const nextId = columnas.length ? Math.max(...columnas.map(c => Number(c.columnaId) || 0)) + 1 : 1;
			const columnaId = payload?.columna?.tipo?.id ?? payload.columnaId ?? nextId;
			const source = payload?.columna ? payload.columna : payload;
			const nueva = { tipo: 'linea', mapeoId: Number(mapeoId), columnaId: Number(columnaId), ...source, fechaCreacion: now() };
			columnas.push(nueva);
			return { ...nueva }
			},
	async updateColumnaLinea(mapeoId: any, payload: any): Promise<any> { 
			await delay(20);
			const columnaIdFromPayload = payload?.columnaId ?? payload?.columna?.tipo?.id
			const idx = columnas.findIndex(c => c.columnaId === Number(columnaIdFromPayload) && c.mapeoId === Number(mapeoId));
			if (idx === -1) throw new Error('Not found');
			columnas[idx] = {
				...columnas[idx],
				columnaId: Number(columnaIdFromPayload) || columnas[idx].columnaId,
				regex: payload?.columna?.regex ?? columnas[idx].regex,
				bolActivo: payload?.columna?.bolActivo ?? columnas[idx].bolActivo,
				fechaUltimaModificacion: now()
			}
			return columnas[idx]
		},
	async patchActivarColumnaLinea(mapeoId: any, payload: any): Promise<any> { await delay(10); const id = payload?.columna?.tipo?.id ?? payload?.columnaId ?? payload?.id; let c = columnas.find(x => x.columnaId === Number(id) && x.mapeoId === Number(mapeoId)); if (!c) c = columnas.find(x => x.columnaId === Number(id)); if (c) { c.bolActivo = true; c.fechaUltimaModificacion = now() } return c },
	async patchDesactivarColumnaLinea(mapeoId: any, payload: any): Promise<any> { await delay(10); const id = payload?.columna?.tipo?.id ?? payload?.columnaId ?? payload?.id; let c = columnas.find(x => x.columnaId === Number(id) && x.mapeoId === Number(mapeoId)); if (!c) c = columnas.find(x => x.columnaId === Number(id)); if (c) { c.bolActivo = false; c.fechaUltimaModificacion = now() } return c },
		async createColumnaCampana(mapeoId: string | number, payload: any): Promise<any> { 
			await delay(20);
			const nextId = columnas.length ? Math.max(...columnas.map(c => Number(c.columnaId) || 0)) + 1 : 1;
			const columnaId = payload?.columna?.tipo?.id ?? payload.columnaId ?? nextId;
			const source = payload?.columna ? payload.columna : payload;
			const nueva = { mapeoId: Number(mapeoId), columnaId: Number(columnaId), ...source, fechaCreacion: now() };
			columnas.push(nueva);
			return { ...nueva }
			},
	async updateColumnaCampana(mapeoId: any, payload: any): Promise<any> { 
			await delay(20);
			const columnaIdFromPayload = payload?.columnaId ?? payload?.columna?.tipo?.id
			const idx = columnas.findIndex(c => c.columnaId === Number(columnaIdFromPayload) && c.mapeoId === Number(mapeoId));
			if (idx === -1) throw new Error('Not found');
			columnas[idx] = {
				...columnas[idx],
				columnaId: Number(columnaIdFromPayload) || columnas[idx].columnaId,
				regex: payload?.columna?.regex ?? columnas[idx].regex,
				bolActivo: payload?.columna?.bolActivo ?? columnas[idx].bolActivo,
				fechaUltimaModificacion: now()
			}
			return columnas[idx]
		},
	async patchActivarColumnaCampana(mapeoId: any, payload: any): Promise<any> { await delay(10); const id = payload?.columna?.tipo?.id ?? payload?.columnaId ?? payload?.id; let c = columnas.find(x => x.columnaId === Number(id) && x.mapeoId === Number(mapeoId)); if (!c) c = columnas.find(x => x.columnaId === Number(id)); if (c) { c.bolActivo = true; c.fechaUltimaModificacion = now() } return c },
	async patchDesactivarColumnaCampana(mapeoId: any, payload: any): Promise<any> { await delay(10); const id = payload?.columna?.tipo?.id ?? payload?.columnaId ?? payload?.id; let c = columnas.find(x => x.columnaId === Number(id) && x.mapeoId === Number(mapeoId)); if (!c) c = columnas.find(x => x.columnaId === Number(id)); if (c) { c.bolActivo = false; c.fechaUltimaModificacion = now() } return c },
	async postBitacoraUsuario(_payload: any): Promise<any> { await delay(10); return { ok: true } }
}