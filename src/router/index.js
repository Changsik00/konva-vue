import Vue from "vue"
import VueRouter from "vue-router"

Vue.use(VueRouter)

const routes = [
  {
    path: "/test",
    name: "Test",
    component: () => import(/* webpackChunkName: "test" */ "../views/Test.vue")
  },
  {
    path: "/",
    name: "Konva",
    component: () => import(/* webpackChunkName: "konva" */ "../views/Konva.vue")
  }
]

const router = new VueRouter({
  mode: "history",
  routes
})

export default router
