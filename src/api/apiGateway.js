import { apiRequest as mockApiRequest } from './mockApi.js';
import { apiClient } from './apiClient.js';

/**
 * Configuración de entorno.
 * Para cambiar entre mock y backend real, edita window.__APP_CONFIG__ en index.html:
 *   <script>window.__APP_CONFIG__ = { USE_MOCKS: false, API_BASE_URL: 'https://tu-backend.com' };</script>
 * No modificar este archivo para cambiar de entorno.
 */
export const USE_MOCKS = window.__APP_CONFIG__?.USE_MOCKS ?? true;

function normalizeRoute(route) {
  if (!route) return '';
  return route.startsWith('/') ? route.slice(1) : route;
}

/**
 * Gateway de API central. Abstrae si usar mocks o backend real.
 * Siempre devuelve el dato desenvuelto (sin wrapper { data: ... }).
 */
export async function apiGateway({ resource, path, method = 'GET', params } = {}) {
  const route = path || resource;
  if (!route) {
    throw new Error('Resource o path requerido para apiGateway');
  }

  const normalizedRoute = normalizeRoute(route);

  if (USE_MOCKS) {
    // mockApi devuelve { data: ... } — lo desenvolvemos aquí una sola vez
    const response = await mockApiRequest({ resource: normalizedRoute, method, params });
    return response?.data !== undefined ? response.data : response;
  }

  let finalPath = `/${normalizedRoute}`;
  let body;

  if (method === 'GET' && params) {
    const query = new URLSearchParams(params).toString();
    if (query) finalPath += `?${query}`;
  } else {
    body = params;
  }

  // apiClient ya desenvuelve { data: ... } internamente, así que el contrato es consistente
  return apiClient({ path: finalPath, method, body });
}