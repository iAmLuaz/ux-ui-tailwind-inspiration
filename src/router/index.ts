import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import MapeoView from '../views/MapeoView.vue'
import ColumnasView from '../views/ColumnasView.vue'
// import CatalogosView from '../views/CatalogosView.vue'
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/mapeo'
  },
  {
    path: '/mapeo',
    name: 'mapeo',
    component: MapeoView
  },
  {
    path: '/columnas',
    name: 'columnas',
    component: ColumnasView
  },
  // {
  //   path: '/catalogos',
  //   name: 'catalogos',
  //   component: CatalogosView
  // }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router