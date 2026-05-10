import { magicLoop } from '../../api/magicLoops.js';

/**
 * Obtiene las citas de hoy del médico
 */
export async function getCitasHoy(medicoId) {
  console.log('🔍 [DEBUG medicoService] getCitasHoy called with medicoId:', medicoId);
  
  const result = await magicLoop({ resource: 'citas', method: 'GET' });
  console.log('🔍 [DEBUG medicoService] magicLoop returned:', result);
  
  const today = new Date().toISOString().split('T')[0];
  console.log('🔍 [DEBUG medicoService] Today date:', today);

  const filtered = result.data.filter((cita) => {
    const matches = cita.id_medico_fk === medicoId && cita.fecha === today;
    if (matches) {
      console.log('🔍 [DEBUG medicoService] Cita matches:', cita);
    }
    return matches;
  });

  console.log('🔍 [DEBUG medicoService] Filtered citas count:', filtered.length);
  return filtered;
}

/**
 * Obtiene la historia clínica de un paciente
 */
export async function getHistoriaClinica(pacienteId) {
  const result = await magicLoop({ resource: 'citas', method: 'GET' });
  const citas = result.data.filter((cita) => cita.id_paciente_fk === pacienteId);
  
  // Obtener datos del paciente
  const pacientes = await magicLoop({ resource: 'pacientes', method: 'GET', params: { id_paciente: pacienteId } });
  const paciente = pacientes.data[0];

  // Obtener historia clínica
  const historiasResult = await magicLoop({ resource: 'historias_clinicas', method: 'GET' });
  const historia = historiasResult.data.find((h) => h.id_paciente_fk === pacienteId);

  // Obtener consultas previas
  const consultasResult = await magicLoop({ resource: 'consultas', method: 'GET', params: { id_historia_clinica_fk: historia?.id_historia_clinica } });
  
  return {
    paciente,
    historia,
    citas,
    consultasAntes: consultasResult.data || [],
  };
}

/**
 * Obtiene detalles de un paciente específico
 */
export async function getPacienteDetalle(pacienteId) {
  const result = await magicLoop({ resource: 'citas', method: 'GET' });
  const citas = result.data.filter((cita) => cita.id_paciente_fk === pacienteId);
  
  // Obtener datos del paciente por búsqueda
  const pacientesResult = await magicLoop({ resource: 'pacientes', method: 'GET' });
  const paciente = pacientesResult.data.find((p) => p.id_paciente === pacienteId);

  return { paciente, citas };
}

/**
 * Registra una consulta con servicios
 */
export async function registrarConsultaConServicios(payload) {
  // payload contiene: id_cita_fk, id_historia_clinica_fk, diagnostico, observacion, servicios_ids[]
  const resultado = await magicLoop({ resource: 'consultas', method: 'POST', params: payload });
  
  return resultado.data;
}

/**
 * Obtiene todas las citas del médico en un rango de fechas
 */
export async function getCitasPorFecha(medicoId, fechaInicio, fechaFin) {
  const result = await magicLoop({ resource: 'citas', method: 'GET' });

  return result.data.filter((cita) => {
    const citaDate = new Date(cita.fecha);
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    return cita.id_medico_fk === medicoId && citaDate >= inicio && citaDate <= fin;
  });
}

/**
 * Obtiene la lista de servicios disponibles
 */
export async function getServicios() {
  const result = await magicLoop({ resource: 'servicios', method: 'GET' });
  return result.data || [];
}

/**
 * Busca pacientes por documento o nombre
 */
export async function buscarPacientes(query) {
  const result = await magicLoop({ resource: 'pacientes', method: 'GET', params: { query } });
  return result.data;
}

/**
 * Obtiene todas las citas del médico (no solo del día)
 */
export async function getTodasCitasMedico(medicoId) {
  const result = await magicLoop({ resource: 'citas', method: 'GET' });
  return result.data.filter((cita) => cita.id_medico_fk === medicoId);
}
