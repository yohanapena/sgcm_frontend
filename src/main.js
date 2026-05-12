import { initApp } from './app/App.js';
import { initializeMockApi } from './api/mockApi.js';

initializeMockApi();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Inicializando aplicación...');
    await initApp();
    console.log('Aplicación inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    // Mostrar error en la UI
    const loginError = document.getElementById('login-error');
    if (loginError) {
      loginError.textContent = 'Error al inicializar la aplicación: ' + error.message;
      loginError.classList.remove('d-none');
    }
  }
});
