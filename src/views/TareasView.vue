<script setup>
import CrudTable from '../components/CrudTable.vue'

const headers = ['ID Tarea', 'Descripción', 'Responsable', 'Prioridad']
const data = [
  { id: 'TSK-99', desc: 'Revisar logs de BI', resp: 'Admin Sistema', prio: 'Alta' },
  { id: 'TSK-100', desc: 'Actualizar tokens', resp: 'DevOps', prio: 'Media' },
  { id: 'TSK-101', desc: 'Validar templates', resp: 'Mkt Team', prio: 'Baja' }
]
</script>

<template>
  <CrudTable titulo="1.3 Tareas" :columnas="headers" :datos="data" />
</template>