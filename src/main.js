import { createApp } from 'vue';
import App from './App.vue';
// import Router from './router';
 
const app = createApp(App);

// global
app
// .use(Router)
.mount('#app');

document.execCommand('paste')
document.execCommand('cut')