export function validateRequired(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function validateUniqueId(pacientes, numero_identificacion) {
  return !pacientes.some((item) => item.numero_identificacion === numero_identificacion);
}

export function validateAppointmentRules(citas, pacienteId, fecha) {
  const tieneActiva = citas.some((cita) => cita.id_paciente_fk === pacienteId && cita.estado === 'Agendada');
  return !tieneActiva;
}
