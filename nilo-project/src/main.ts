import { createApp } from 'vue'
import App from '@/app/App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from '@/app/router'

import '@/assets/scss/base.scss'
import '@/assets/icon/iconfont.css'
import { createPinia } from 'pinia'

const pinia = createPinia()
const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.use(pinia)

app.mount('#app')

