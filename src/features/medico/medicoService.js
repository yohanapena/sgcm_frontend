import { apiGateway } from '../../api/apiGateway.js';

async function attachPacienteInfo(citas = []) {
  const pacientes = await apiGateway({ resource: 'pacientes', method: 'GET' }) || [];
  const pacientesById = new Map((pacientes || []).map((paciente) => [paciente.id_paciente, paciente]));

  return citas.map((cita) => {
    const paciente = pacientesById.get(cita.id_paciente_fk) || null;
    return {
      ...cita,
      paciente,
      paciente_nombre:
        paciente?.nombre || cita.paciente_nombre || cita.nombre_paciente || cita.pacienteNombre || '',
      paciente_apellido:
        paciente?.primer_apellido || paciente?.segundo_apellido || paciente?.apellido || cita.paciente_apellido || cita.pacienteApellido || '',
    };
  });
}

/**
 * Obtiene las citas de hoy del médico
 */
export async function getCitasHoy(medicoId) {
  console.log('🔍 [DEBUG medicoService] getCitasHoy called with medicoId:', medicoId);
  
  const result = await apiGateway({ resource: 'citas', method: 'GET' });
  console.log('🔍 [DEBUG medicoService] apiGateway returned:', result);
  
  const today = new Date().toISOString().split('T')[0];
  console.log('🔍 [DEBUG medicoService] Today date:', today);

  const filtered = result.filter((cita) => {
    const matches = cita.id_medico_fk === medicoId && cita.fecha === today;
    if (matches) {
      console.log('🔍 [DEBUG medicoService] Cita matches:', cita);
    }
    return matches;
  });

  console.log('🔍 [DEBUG medicoService] Filtered citas count:', filtered.length);
  return attachPacienteInfo(filtered);
}

/**
 * Obtiene la historia clínica de un paciente
 */
export async function getHistoriaClinica(pacienteId) {
  // Se mantiene como helper “completo” para pantallas/flujo existentes
  const result = await apiGateway({ resource: 'citas', method: 'GET' });
  const citas = result.filter((cita) => cita.id_paciente_fk === pacienteId);

  // Obtener datos del paciente
  const pacientes = await apiGateway({ resource: 'pacientes', method: 'GET', params: { id_paciente: pacienteId } });
  const paciente = pacientes[0];

  // Obtener historia clínica
  const historiasResult = await apiGateway({ resource: 'historias_clinicas', method: 'GET' });
  const historia = historiasResult.find((h) => h.id_paciente_fk === pacienteId);

  // Obtener consultas previas
  const consultasResult = await apiGateway({
    resource: 'consultas',
    method: 'GET',
    params: { id_historia_clinica_fk: historia?.id_historia_clinica },
  });

  return {
    paciente,
    historia,
    citas,
    consultasAntes: consultasResult || [],
  };
}

/**
 * Obtiene solo la historia clínica (o null) para un paciente.
 * Útil para el flujo del módulo médico.
 */
export async function getHistoriaClinicaByPaciente(pacienteId) {
  const historiasResult = await apiGateway({ resource: 'historias_clinicas', method: 'GET', params: { pacienteId } });

  // Compatibilidad con mock/contrato futuro: si el mock devuelve todo, filtramos aquí.
  const historias = historiasResult || [];
  return historias.find((h) => h.id_paciente_fk === pacienteId) || null;
}

/**
 * Crea historia clínica (append, no sobrescribe).
 */
export async function createHistoriaClinica({ id_paciente_fk, resumen = '' }) {
  const resultado = await apiGateway({
    resource: 'historias_clinicas',
    method: 'POST',
    params: { id_paciente_fk, resumen, fecha_apertura: new Date().toISOString().split('T')[0] },
  });

  return resultado;
}

/**
 * Registra signos vitales asociados a una consulta.
 * Se modela como recurso independiente para asegurar “append por consulta”.
 */
export async function registrarSignosVitalesPorConsulta({ id_consulta_fk, ...signos }) {
  const resultado = await apiGateway({
    resource: 'signos_vitales',
    method: 'POST',
    params: { id_consulta_fk, ...signos, fecha_registro: new Date().toISOString() },
  });

  return resultado;
}


/**
 * Obtiene detalles de un paciente específico
 */
export async function getPacienteDetalle(pacienteId) {
  const result = await apiGateway({ resource: 'citas', method: 'GET' });
  const citas = result.filter((cita) => cita.id_paciente_fk === pacienteId);
  
  // Obtener datos del paciente por búsqueda
  const pacientesResult = await apiGateway({ resource: 'pacientes', method: 'GET' });
  const paciente = pacientesResult.find((p) => p.id_paciente === pacienteId);

  return { paciente, citas };
}

/**
 * Registra una consulta con servicios
 */
export async function registrarConsultaConServicios(payload) {
  // payload contiene: id_cita_fk, id_historia_clinica_fk, diagnostico, observacion, servicios_ids[]
  const resultado = await apiGateway({ resource: 'consultas', method: 'POST', params: payload });
  
  return resultado;
}

/**
 * Obtiene todas las citas del médico en un rango de fechas
 */
export async function getCitasPorFecha(medicoId, fechaInicio, fechaFin) {
  const result = await apiGateway({ resource: 'citas', method: 'GET' });

  return result.filter((cita) => {
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
  const result = await apiGateway({ resource: 'servicios', method: 'GET' });
  return result || [];
}

/**
 * Busca pacientes por documento o nombre
 */
export async function buscarPacientes(query) {
  const result = await apiGateway({ resource: 'pacientes', method: 'GET', params: { query } });
  return result;
}

/**
 * Obtiene todas las citas del médico (no solo del día)
 */
export async function getTodasCitasMedico(medicoId) {
  const result = await apiGateway({ resource: 'citas', method: 'GET' });
  const filtered = result.filter((cita) => cita.id_medico_fk === medicoId);
  return attachPacienteInfo(filtered);
}
