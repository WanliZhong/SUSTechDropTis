import {createRouter, createWebHashHistory} from "vue-router"

const routes = [
    {
        path: '/',
        component:()=>import("../pages/home.vue")
    },
    {
        path: '/scheduleSystem',
        component:()=>import("../pages/scheduleSystem.vue")
    },
    {
        path: '/fantasyGPA',
        component:()=>import("../pages/fantasyGPA.vue")
    },
    {
        path: "/fastSelection",
        component: ()=>import("../pages/fastSelection.vue")
    }

]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
