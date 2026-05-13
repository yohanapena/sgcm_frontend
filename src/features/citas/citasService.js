import { apiGateway } from '../../api/apiGateway.js';

function normalizeCita(raw) {
  if (!raw) return null;
  return {
    ...raw,
    fecha_cita: raw.fecha_cita || raw.fecha || '',
    hora_cita: raw.hora_cita || raw.hora || '',
    observaciones: raw.observaciones ?? raw.observacion ?? '',
    medico_apellido: raw.medico_apellido || raw.primer_apellido || raw.medicoApellido || '',
    paciente_apellido: raw.paciente_apellido || raw.segundo_apellido || raw.pacienteApellido || '',
    medico_nombre: raw.medico_nombre || raw.nombre_medico || raw.medicoNombre || raw.medico || '',
    paciente_nombre: raw.paciente_nombre || raw.nombre_paciente || raw.pacienteNombre || raw.paciente || '',
  };
}

function normalizeCitas(citas) {
  return Array.isArray(citas) ? citas.map(normalizeCita) : [];
}

function applyCitaFilters(citas, filtros = {}) {
  return citas
    .filter((cita) => {
      if (filtros.estado && filtros.estado !== 'Todas' && filtros.estado !== '') {
        return cita.estado === filtros.estado;
      }
      return true;
    })
    .filter((cita) => {
      if (!filtros.especialidad) return true;
      return cita.especialidad === filtros.especialidad;
    })
    .filter((cita) => {
      if (!filtros.medico) return true;
      return cita.id_medico_fk === Number(filtros.medico);
    })
    .filter((cita) => {
      if (!filtros.fecha_inicio) return true;
      return cita.fecha_cita >= filtros.fecha_inicio;
    })
    .filter((cita) => {
      if (!filtros.fecha_fin) return true;
      return cita.fecha_cita <= filtros.fecha_fin;
    })
    .filter((cita) => {
      if (!filtros.paciente_nombre) return true;
      const query = filtros.paciente_nombre.toLowerCase();
      return `${cita.paciente_nombre} ${cita.paciente_apellido}`.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      const dateA = `${a.fecha_cita} ${a.hora_cita}`;
      const dateB = `${b.fecha_cita} ${b.hora_cita}`;
      return dateA.localeCompare(dateB);
    });
}

export async function createCita(data) {
  const response = await apiGateway({ resource: 'citas', method: 'POST', params: data });
  return normalizeCita(response);
}

export async function getCitasFiltradas(filtros = {}) {
  const response = await apiGateway({ resource: 'citas', method: 'GET' });
  return applyCitaFilters(normalizeCitas(response), filtros);
}

export async function getCita(id) {
  const response = await apiGateway({ resource: `citas/${id}`, method: 'GET' });
  return normalizeCita(response);
}

export async function updateCita(id, data) {
  const response = await apiGateway({ resource: `citas/${id}`, method: 'PUT', params: data });
  return normalizeCita(response);
}

export async function cancelarCita(id, motivo) {
  const response = await apiGateway({ resource: `citas/${id}/cancelar`, method: 'PUT', params: { motivo } });
  return normalizeCita(response);
}

export async function registrarHistorialCita(id, data) {
  const serviciosIds = data?.servicios_ids;
  if (!Array.isArray(serviciosIds) || serviciosIds.length === 0) {
    throw new Error('El historial de cita requiere al menos un servicio seleccionado en servicios_ids.');
  }

  const payload = {
    id_cita_fk: id,
    servicios_ids: serviciosIds,
    diagnostico: data?.diagnostico ?? '',
    observacion: data?.observacion ?? data?.nota_clinica ?? '',
  };

  // Si el backend permite servicios opcionales, eliminar la validación anterior.
  return apiGateway({ resource: 'consultas', method: 'POST', params: payload });
}

export async function getMedicos() {
  const response = await apiGateway({ resource: 'medicos', method: 'GET' });
  return Array.isArray(response)
    ? response.map((medico) => ({
        ...medico,
        apellido: medico.primer_apellido || medico.apellido || '',
      }))
    : [];
}

export async function getEspecialidades() {
  return apiGateway({ resource: 'especialidades', method: 'GET' });
}

export async function getEstados() {
  const response = await apiGateway({ resource: 'estados', method: 'GET' });
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return ['Agendada', 'Atendida', 'Cancelada', 'No asistió'];
}