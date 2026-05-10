import { magicLoop } from '../../api/magicLoops.js';

export async function listCitas(params) {
  return magicLoop({ resource: 'citas', method: 'GET', params });
}

export async function createCita(payload) {
  return magicLoop({ resource: 'citas', method: 'POST', params: payload });
}

export async function updateCita(payload) {
  return magicLoop({ resource: 'citas', method: 'PUT', params: payload });
}
