import { initApp } from './app/App.js';
import { initializeMockApi } from './api/mockApi.js';

initializeMockApi();

document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});
