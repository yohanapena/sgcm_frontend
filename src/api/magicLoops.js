import { apiRequest } from './mockApi.js';

/**
 * Adaptador de datos central. Más adelante puede reemplazarse por llamadas reales.
 */
export async function magicLoop(input) {
  // input: { resource, method, params }
  const response = await apiRequest(input);
  return response;
}
