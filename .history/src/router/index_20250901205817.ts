import { createRouter, createWebHistory } from "vue-router";

// Import des composants/pages
import Home from "../components/Home.vue";
import Recherche from "../components/Recherche.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/recherche", name: "Recherche", component: Recherche },
];

// Utilise la même base que Vite
const base = import.meta.env.BASE_URL || "/laRechercheWeb/";

const router = createRouter({
  history: createWebHistory(base),
  routes,
});

export default router;
