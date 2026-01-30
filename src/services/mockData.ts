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
			case 'LNN': { // Líneas (creamos 1..20)
				const items: any[] = []
				for (let i = 1; i <= 20; i++) {
					// marcamos algunos inactivos para pruebas
					const activo = i % 5 !== 0
					items.push(base(i, `LNN_${i}`, `Línea ${i}`, activo))
				}
				return items
			}
			case 'CMP': // Campañas (ids secuenciales por catálogo)
				return [
					base(1, 'CMP_1', 'Campaña 1'),
					base(2, 'CMP_2', 'Campaña 2')
				]
			case 'ROL': // Roles de usuario
				return [
					base(1, 'ROL_ADMIN', 'Administrador'),
					base(2, 'ROL_USER', 'Usuario')
				]
			case 'CLM': // Clases / Claim (ejemplo)
				return [
					base(1, 'CLM_A', 'Clase A'),
					base(2, 'CLM_B', 'Clase B')
				]
			default:
				// Devolver un catálogo genérico cuando no se reconoce el código
				return [
					base(1, String(codigo), `Catálogo ${String(codigo)}`)
				]
		}
	}
}

const now = () => new Date().toISOString()

let mapeos: any[] = []

// Generar 20 mapeos de ejemplo: mezcla de líneas y campañas
for (let i = 1; i <= 20; i++) {
	if (i <= 12) {
		// mapeos de línea (idABCCatLineaNegocio coincide con LNN id)
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
		// mapeos de campaña (asignamos campana 1 o 2 alternando)
		const campanaId = i % 2 === 0 ? 2 : 1
		// asociamos a una línea existente (aleatoria en 1..12)
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

// Crear 20 columnas de ejemplo, con columnaId únicos 1..20
for (let cid = 1; cid <= 20; cid++) {
	if (cid % 3 !== 0) {
		// columnas de tipo 'linea' asociadas a mapeos de línea (1..12)
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
		// columnas de campaña (sin 'tipo') asociadas a mapeos de campaña (13..20)
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
	async createMapeoLinea(_lineaId: string | number, payload: any): Promise<any> { await delay(30); const id = Math.max(...mapeos.map(m => m.id)) + 1; const nuevo = { id, tipo: 'linea', lineaId: _lineaId, ...payload, fechaCreacion: now(), fechaUltimaModificacion: now() }; mapeos.push(nuevo); return nuevo },
	async createMapeoCampana(_lineaId: string | number, _campanaId: string | number, payload: any): Promise<any> { await delay(30); const id = Math.max(...mapeos.map(m => m.id)) + 1; const nuevo = { id, tipo: 'campana', lineaId: _lineaId, campanaId: _campanaId, ...payload, fechaCreacion: now(), fechaUltimaModificacion: now() }; mapeos.push(nuevo); return nuevo },
	async updateMapeoLinea(payload: any): Promise<any> { await delay(30); const idx = mapeos.findIndex(m => m.id === payload.id); if (idx === -1) throw new Error('Not found'); mapeos[idx] = { ...mapeos[idx], ...payload, fechaUltimaModificacion: now() }; return mapeos[idx] },
	async updateMapeoCampana(payload: any): Promise<any> { await delay(30); const idx = mapeos.findIndex(m => m.id === payload.id); if (idx === -1) throw new Error('Not found'); mapeos[idx] = { ...mapeos[idx], ...payload, fechaUltimaModificacion: now() }; return mapeos[idx] },
	async deleteMapeoLinea(_lineaId: string | number, _mapeoId: string | number): Promise<void> { await delay(30); mapeos = mapeos.filter(m => m.id !== Number(_mapeoId)) },
	async patchActivarMapeoLinea(payload: any): Promise<any> { await delay(20); const m = mapeos.find(x => x.id === payload.id); if (m) { m.bolActivo = true; m.fechaUltimaModificacion = now() } return m },
	async patchDesactivarMapeoLinea(payload: any): Promise<any> { await delay(20); const m = mapeos.find(x => x.id === payload.id); if (m) { m.bolActivo = false; m.fechaUltimaModificacion = now() } return m },
	async patchActivarMapeoCampana(payload: any): Promise<any> { await delay(20); const m = mapeos.find(x => x.id === payload.id); if (m) { m.bolActivo = true; m.fechaUltimaModificacion = now() } return m },
	async patchDesactivarMapeoCampana(payload: any): Promise<any> { await delay(20); const m = mapeos.find(x => x.id === payload.id); if (m) { m.bolActivo = false; m.fechaUltimaModificacion = now() } return m },
	async postBitacoraUsuario(_payload: any): Promise<any> { await delay(10); return { ok: true } }
}

export const mockColumnasApi = {
	async getColumnasByMapeo(mapeoId: string | number): Promise<any[]> { await delay(30); return columnas.filter(c => String(c.mapeoId) === String(mapeoId)) },
	async getColumnasLinea(): Promise<any[]> { await delay(20); return columnas.filter(c => c.tipo === 'linea') },
	async getColumnasCampana(): Promise<any[]> { await delay(20); return columnas.filter(c => !c.tipo) },
	async getColumnasCampanaByMapeo(mapeoId: string | number): Promise<any[]> { await delay(20); return columnas.filter(c => String(c.mapeoId) === String(mapeoId) && !c.tipo) },
	async createColumnaCampanaGlobal(payload: any): Promise<any> { await delay(20); const nueva = { ...payload, fechaCreacion: now() }; columnas.push(nueva); return nueva },
	async createColumnaLinea(mapeoId: string | number, payload: any): Promise<any> { await delay(20); const nueva = { tipo: 'linea', mapeoId: Number(mapeoId), ...payload, fechaCreacion: now() }; columnas.push(nueva); return nueva },
	async updateColumnaLinea(payload: any): Promise<any> { await delay(20); const idx = columnas.findIndex(c => c.columnaId === payload.columnaId && c.mapeoId === payload.mapeoId); if (idx === -1) throw new Error('Not found'); columnas[idx] = { ...columnas[idx], ...payload, fechaUltimaModificacion: now() }; return columnas[idx] },
	async patchActivarColumnaLinea(payload: any): Promise<any> { await delay(10); const c = columnas.find(x => x.columnaId === payload.columnaId && x.mapeoId === payload.mapeoId); if (c) { c.bolActivo = true; c.fechaUltimaModificacion = now() } return c },
	async patchDesactivarColumnaLinea(payload: any): Promise<any> { await delay(10); const c = columnas.find(x => x.columnaId === payload.columnaId && x.mapeoId === payload.mapeoId); if (c) { c.bolActivo = false; c.fechaUltimaModificacion = now() } return c },
	async createColumnaCampana(mapeoId: string | number, payload: any): Promise<any> { await delay(20); const nueva = { mapeoId: Number(mapeoId), ...payload, fechaCreacion: now() }; columnas.push(nueva); return nueva },
	async updateColumnaCampana(payload: any): Promise<any> { await delay(20); const idx = columnas.findIndex(c => c.columnaId === payload.columnaId && c.mapeoId === payload.mapeoId); if (idx === -1) throw new Error('Not found'); columnas[idx] = { ...columnas[idx], ...payload, fechaUltimaModificacion: now() }; return columnas[idx] },
	async patchActivarColumnaCampana(payload: any): Promise<any> { await delay(10); const c = columnas.find(x => x.columnaId === payload.columnaId && x.mapeoId === payload.mapeoId); if (c) { c.bolActivo = true; c.fechaUltimaModificacion = now() } return c },
	async patchDesactivarColumnaCampana(payload: any): Promise<any> { await delay(10); const c = columnas.find(x => x.columnaId === payload.columnaId && x.mapeoId === payload.mapeoId); if (c) { c.bolActivo = false; c.fechaUltimaModificacion = now() } return c },
	async postBitacoraUsuario(_payload: any): Promise<any> { await delay(10); return { ok: true } }
}
