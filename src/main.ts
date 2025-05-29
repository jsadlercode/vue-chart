import './assets/main.css';
import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Button from 'primevue/button';

const app = createApp(App);
app.component('Button', Button);
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
});

app.mount('#app');
