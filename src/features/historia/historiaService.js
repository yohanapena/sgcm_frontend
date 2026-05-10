import { magicLoop } from '../../api/magicLoops.js';

export async function getHistoriaClinica(pacienteId) {
  return magicLoop({ resource: 'historia_clinica', method: 'GET', params: { pacienteId } });
}

export async function listConsultas(pacienteId) {
  return magicLoop({ resource: 'consultas', method: 'GET', params: { pacienteId } });
}
