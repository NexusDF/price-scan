import { createRouter, createWebHistory } from 'vue-router'
import CameraView from '@/views/CameraView.vue'
import ConfirmView from '@/views/ConfirmView.vue'
import HistoryView from '@/views/HistoryView.vue'
import ProductView from '@/views/ProductView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'camera', component: CameraView },
    { path: '/confirm', name: 'confirm', component: ConfirmView },
    { path: '/product', name: 'product', component: ProductView },
    { path: '/history', name: 'history', component: HistoryView },
  ],
})

router.afterEach(() => {
  window.scrollTo(0, 0)
})
