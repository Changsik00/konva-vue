import Vue from "vue"
import VueRouter from "vue-router"

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue")
  },
  {
    path: "/konva",
    name: "Konva",
    component: () => import(/* webpackChunkName: "konva" */ "../views/Konva.vue")
  }
]

const router = new VueRouter({
  mode: "history",
  routes
})

export default router
