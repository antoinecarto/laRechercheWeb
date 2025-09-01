import "./style.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // <-- important

const app = createApp(App);
app.use(router); // <-- il faut appeler app.use(router)
app.mount("#app");
