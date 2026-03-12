import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import VueCookies from 'vue-cookies'

import '@/assets/scss/base.scss'
import './assets/icon/iconfont.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)

app.config.globalProperties.vueCookies = VueCookies

app.mount('#app')
