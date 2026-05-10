import { apiRequest } from '../../api/realApi.js';

const API_BASE_URL = 'http://localhost:4000';

export async function searchPacientes(query) {
  const response = await apiRequest({ path: `/pacientes/buscar?q=${encodeURIComponent(query)}` });
  return response;
}

export async function createPaciente(payload) {
  const response = await apiRequest({ path: '/pacientes/', method: 'POST', body: payload });
  return response;
}

export async function updatePaciente(id, payload) {
  const response = await apiRequest({ path: `/pacientes/${id}`, method: 'PUT', body: payload });
  return response;
}

export async function getPaciente(id) {
  const response = await apiRequest({ path: `/pacientes/${id}` });
  return response;
}
