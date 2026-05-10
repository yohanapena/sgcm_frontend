import { mountAuth } from '../features/auth/authService.js';

export async function initApp() {
  console.log('App inicializada');
  await mountAuth();
}
