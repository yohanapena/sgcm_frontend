// src/api/apiClient.js
// Para cambiar la URL del backend, edita window.__APP_CONFIG__.API_BASE_URL en index.html
const API_BASE_URL = window.__APP_CONFIG__?.API_BASE_URL ?? 'http://localhost:8000';

function getAuthToken() {
  return localStorage.getItem('jwtToken');
}

const AUTH_STORAGE_KEYS = ['jwtToken', 'userRole', 'userName', 'userId', 'userMedicoId', 'authUser'];

function redirectToLogin() {
  // Limpieza selectiva: solo las claves de auth, no todo el localStorage
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  window.location.reload();
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiClient({ path, method = 'GET', body, headers = {} } = {}) {
  if (!path) throw new Error('Path requerido');

  const defaultHeaders = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) defaultHeaders.Authorization = `Bearer ${token}`;

  const finalHeaders = { ...defaultHeaders, ...headers };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(`NETWORK_ERROR: ${error.message}`);
  }

  if (response.status === 401) {
    redirectToLogin();
    throw new Error('Sesión expirada');
  }

  const data = await safeParseJson(response);
  if (!response.ok) {
    const message = data?.message || data?.error || data?.detail || 'Error del servidor';
    throw new Error(message);
  }

  // Flexibilidad en contrato: si tiene "data", usar data; sino, devolver directamente
  return data?.data !== undefined ? data.data : data;
}

// Métodos convenientes
export const apiGet = (path) => apiClient({ path });
export const apiPost = (path, body) => apiClient({ path, method: 'POST', body });
export const apiPut = (path, body) => apiClient({ path, method: 'PUT', body });
export const apiDelete = (path) => apiClient({ path, method: 'DELETE' });