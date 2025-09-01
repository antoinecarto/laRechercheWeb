import { createRouter, createWebHistory } from "vue-router";

// Import des composants/pages
import Home from "../components/Home.vue";
import Recherche from "../views/Recherche.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/recherche", name: "Recherche", component: Recherche },
];
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
