import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles.css'
import { useAuthStore } from './stores/auth'

const app    = createApp(App)
const pinia  = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

/* Inicia o listener de auth uma única vez, após o Pinia estar registrado */
useAuthStore().init()
