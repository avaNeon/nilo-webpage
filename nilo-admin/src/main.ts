import { createApp } from "vue";
import App from "@/app/App.vue";
import router from "@/app/router";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "@/assets/scss/base.scss";

const pinia = createPinia();
const app = createApp(App);
app.use(ElementPlus);
app.use(router);
app.use(pinia);

app.mount("#app");
