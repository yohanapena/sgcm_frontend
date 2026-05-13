import { apiGateway } from '../../api/apiGateway.js';

const MOCK_EPS = [
  { id_eps: 1, nombre: 'Sura' },
  { id_eps: 2, nombre: 'Sanitas' },
  { id_eps: 3, nombre: 'Compensar' },
  { id_eps: 4, nombre: 'Nueva EPS' }
];

const MOCK_REGIMENES = [
  { id_regimen: 1, nombre: 'Contributivo' },
  { id_regimen: 2, nombre: 'Subsidiado' }
];

export async function searchPacientes(query) {
  if (!query || query.trim() === '') {
    return apiGateway({ resource: 'pacientes', method: 'GET' });
  }

  return apiGateway({ resource: 'pacientes', method: 'GET', params: { query: query.trim() } });
}

export async function getPaciente(id) {
  return apiGateway({ resource: `pacientes/${id}`, method: 'GET' });
}

export async function createPaciente(data) {
  return apiGateway({ resource: 'pacientes', method: 'POST', params: data });
}

export async function updatePaciente(id, data) {
  return apiGateway({ resource: `pacientes/${id}`, method: 'PUT', params: data });
}

export async function getEps() {
  try {
    return apiGateway({ resource: 'eps', method: 'GET' });
  } catch (error) {
    console.warn('GET EPS en backend falló, usando mock:', error.message);
    return MOCK_EPS;
  }
}

export async function getRegimenes() {
  try {
    return apiGateway({ resource: 'regimenes', method: 'GET' });
  } catch (error) {
    console.warn('GET regímenes en backend falló, usando mock:', error.message);
    return MOCK_REGIMENES;
  }
}
