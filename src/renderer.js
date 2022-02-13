import { createApp } from "vue"
import Antd from "ant-design-vue"
import "ant-design-vue/dist/antd.css"
import router from "/src/config/router"
import store from "/src/config/store"
import SUSTechDropTis from "/src/SUSTechDropTis.vue"

const app = createApp(SUSTechDropTis)
app.use(router)
app.use(Antd)
app.mount("#app")
app.use(store)

