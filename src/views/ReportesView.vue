<script setup>
import CrudTable from '../components/CrudTable.vue'

const headers = ['Nombre Reporte', 'Frecuencia', 'Formato', 'Última Gen.']
const data = [
  { nombre: 'Trazabilidad Envíos', freq: 'Diario', fmt: 'PDF', last: 'Hoy 08:00' },
  { nombre: 'Errores de Mapeo', freq: 'Semanal', fmt: 'Excel', last: 'Ayer' },
  { nombre: 'KPIs Campañas', freq: 'Mensual', fmt: 'Dashboard', last: '01/01/2026' }
]
</script>

<template>
  <CrudTable titulo="1.4 Reportes" :columnas="headers" :datos="data" />
</template>