import { createRouter, createWebHistory } from "vue-router";

// Import des composants/pages
import Home from "../components/Index.vue";

const routes = [{ path: "/", name: "Home", component: Home }];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
