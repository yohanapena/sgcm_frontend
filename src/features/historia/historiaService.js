import { apiGateway } from '../../api/apiGateway.js';

export async function getHistoriaClinica(pacienteId) {
  return apiGateway({ resource: 'historias_clinicas', method: 'GET', params: { pacienteId } });
}

export async function listConsultas(pacienteId) {
  return apiGateway({ resource: 'consultas', method: 'GET', params: { pacienteId } });
}
