import { EPS } from '../data/eps.js';
import { REGIMENES } from '../data/regimenes.js';
import { ESPECIALIDADES } from '../data/especialidades.js';
import { SERVICIOS } from '../data/servicios.js';
import { MEDICOS } from '../data/medicos.js';
import { HORARIOS } from '../data/horarios.js';

const today = new Date().toISOString().split('T')[0];

const store = {
  pacientes: [
    {
      id_paciente: 1,
      numero_identificacion: '1020304050',
      nombre: 'María',
      primer_apellido: 'González',
      segundo_apellido: 'López',
      fecha_de_nacimiento: '1985-03-15',
      direccion: 'Calle 123 #45-67',
      id_eps_fk: 1,
      id_regimen_fk: 1,
      contactos: [
        { tipo: 'celular', valor: '321-456-7890' },
        { tipo: 'email', valor: 'maria@example.com' },
      ],
    },
    {
      id_paciente: 2,
      numero_identificacion: '1098765432',
      nombre: 'Juan',
      primer_apellido: 'Pérez',
      segundo_apellido: 'García',
      fecha_de_nacimiento: '1975-07-22',
      direccion: 'Calle 456 #89-10',
      id_eps_fk: 2,
      id_regimen_fk: 1,
      contactos: [
        { tipo: 'celular', valor: '310-123-4567' },
        { tipo: 'email', valor: 'juan@example.com' },
      ],
    },
    {
      id_paciente: 3,
      numero_identificacion: '1111111111',
      nombre: 'Ana',
      primer_apellido: 'Martínez',
      segundo_apellido: 'Rodríguez',
      fecha_de_nacimiento: '1990-11-10',
      direccion: 'Calle 789 #12-34',
      id_eps_fk: 1,
      id_regimen_fk: 2,
      contactos: [
        { tipo: 'celular', valor: '300-555-1234' },
        { tipo: 'email', valor: 'ana@example.com' },
      ],
    },
  ],
  medicos: [...MEDICOS],
  citas: [
    {
      id_cita: 1,
      fecha: today,
      hora: '09:00',
      estado: 'Agendada',
      id_paciente_fk: 1,
      id_medico_fk: 2,
      id_horario_medico_fk: 1,
      observacion: 'Control de rutina',
    },
    {
      id_cita: 2,
      fecha: today,
      hora: '10:00',
      estado: 'Agendada',
      id_paciente_fk: 2,
      id_medico_fk: 2,
      id_horario_medico_fk: 1,
      observacion: 'Revisión cardíaca',
    },
    {
      id_cita: 3,
      fecha: today,
      hora: '11:00',
      estado: 'Agendada',
      id_paciente_fk: 3,
      id_medico_fk: 2,
      id_horario_medico_fk: 1,
      observacion: 'Síntomas de gripe',
    },
  ],
  consultas: [
    {
      id_consulta: 1,
      id_cita_fk: null,
      id_historia_clinica_fk: 1,
      diagnostico: 'Hipertensión controlada',
      observacion: 'Paciente con buen control de medicamentos',
      fecha_consulta: '2026-04-18',
      servicios_ids: [1, 2],
    },
    {
      id_consulta: 2,
      id_cita_fk: null,
      id_historia_clinica_fk: 2,
      diagnostico: 'Diabetes tipo 2 descompensada',
      observacion: 'Glucosa elevada en último control. Ajustar dosis de metformina.',
      fecha_consulta: '2026-04-17',
      servicios_ids: [1, 5],
    },
    {
      id_consulta: 3,
      id_cita_fk: null,
      id_historia_clinica_fk: 1,
      diagnostico: 'Resfriado común',
      observacion: 'Síntomas leves. Medicamento sintomático por 5 días.',
      fecha_consulta: '2026-04-10',
      servicios_ids: [1],
    },
  ],
  historias_clinicas: [
    {
      id_historia_clinica: 1,
      id_paciente_fk: 1,
      resumen: 'Paciente con antecedente de hipertensión. Toma medicamentos regularmente. Sin alergias conocidas.',
      fecha_apertura: '2025-01-15',
    },
    {
      id_historia_clinica: 2,
      id_paciente_fk: 2,
      resumen: 'Paciente con antecedente de diabetes tipo 2. Realiza seguimiento trimestral. Alergia a penicilina.',
      fecha_apertura: '2025-02-10',
    },
    {
      id_historia_clinica: 3,
      id_paciente_fk: 3,
      resumen: 'Paciente sano sin antecedentes de importancia. Primera consulta.',
      fecha_apertura: '2026-04-01',
    },
  ],
  historial_citas: [],
  eps: EPS,
  regimenes: REGIMENES,
  especialidades: ESPECIALIDADES,
  servicios: SERVICIOS,
  horarios: HORARIOS,
};

export function initializeMockApi() {
  console.log('Mock API inicializada');
}

export async function apiRequest({ resource, method, params }) {
  switch (resource) {
    case 'eps':
      return { data: store.eps };
    case 'regimenes':
      return { data: store.regimenes };
    case 'especialidades':
      return { data: store.especialidades };
    case 'servicios':
      return { data: store.servicios };
    case 'medicos':
      return handleMedicos(method, params);
    case 'horarios':
      return { data: store.horarios };
    case 'pacientes':
      return handlePacientes(method, params);
    case 'citas':
      return handleCitas(method, params);
    case 'consultas':
      return handleConsultas(method, params);
    case 'historial_citas':
      return handleHistorialCitas(method, params);
    default:
      return { data: [] };
  }
}

function handlePacientes(method, params) {
  if (method === 'GET') {
    if (params?.id_paciente) {
      const data = store.pacientes.filter((paciente) => paciente.id_paciente === params.id_paciente);
      return { data };
    }

    const queryValue = params?.query ?? '';
    const query = typeof queryValue === 'number' ? String(queryValue) : queryValue.toLowerCase();

    const data = store.pacientes.filter((paciente) =>
      paciente.numero_identificacion.includes(query) ||
      (`${paciente.nombre} ${paciente.primer_apellido} ${paciente.segundo_apellido}`.toLowerCase().includes(query))
    );
    return { data };
  }

  if (method === 'POST') {
    const nuevo = { id_paciente: store.pacientes.length + 1, ...params };
    store.pacientes.push(nuevo);
    return { data: nuevo };
  }

  return { data: [] };
}

function handleMedicos(method, params) {
  if (method === 'GET') {
    if (params?.id_medico) {
      const data = store.medicos.filter((medico) => medico.id_medico === params.id_medico);
      return { data };
    }

    const queryValue = params?.query ?? '';
    const query = typeof queryValue === 'number' ? String(queryValue) : queryValue.toLowerCase();
    const data = store.medicos.filter((medico) =>
      medico.nombre.toLowerCase().includes(query) ||
      medico.especialidad.toLowerCase().includes(query)
    );
    return { data };
  }

  if (method === 'POST') {
    const nuevo = {
      id_medico: store.medicos.length ? Math.max(...store.medicos.map((medico) => medico.id_medico)) + 1 : 1,
      ...params,
    };
    store.medicos.push(nuevo);
    return { data: nuevo };
  }

  if (method === 'PUT') {
    const medicoId = params?.id_medico;
    const index = store.medicos.findIndex((medico) => medico.id_medico === medicoId);
    if (index === -1) {
      return { data: null };
    }
    store.medicos[index] = {
      ...store.medicos[index],
      ...params,
    };
    return { data: store.medicos[index] };
  }

  return { data: [] };
}

function handleCitas(method, params) {
  console.log('🔍 [DEBUG mockApi] handleCitas called with method:', method, 'params:', params);
  console.log('🔍 [DEBUG mockApi] Current store.citas:', store.citas);
  
  if (method === 'GET') {
    const data = store.citas.filter((cita) => {
      if (!params) return true;
      if (params.medicoId && cita.id_medico_fk !== params.medicoId) return false;
      if (params.pacienteId && cita.id_paciente_fk !== params.pacienteId) return false;
      return true;
    });
    console.log('🔍 [DEBUG mockApi] handleCitas returning:', data);
    return { data };
  }

  if (method === 'POST') {
    const nuevo = { id_cita: store.citas.length + 1, estado: 'Agendada', ...params };
    store.citas.push(nuevo);
    store.historial_citas.push({ id_historial: store.historial_citas.length + 1, id_cita_fk: nuevo.id_cita, estado: 'Agendada', fecha: new Date().toISOString() });
    return { data: nuevo };
  }

  return { data: [] };
}

function handleConsultas(method, params) {
  if (method === 'GET') {
    const data = store.consultas.filter((consulta) => {
      if (params?.id_historia_clinica_fk) return consulta.id_historia_clinica_fk === params.id_historia_clinica_fk;
      return true;
    });
    return { data };
  }

  if (method === 'POST') {
    const nueva = {
      id_consulta: store.consultas.length + 1,
      ...params,
      fecha_consulta: new Date().toISOString().split('T')[0],
    };
    store.consultas.push(nueva);

    // Registrar cambio de cita a "Atendida"
    if (params.id_cita_fk) {
      const cita = store.citas.find((c) => c.id_cita === params.id_cita_fk);
      if (cita && cita.estado !== 'Atendida') {
        store.historial_citas.push({
          id_historial: store.historial_citas.length + 1,
          id_cita_fk: params.id_cita_fk,
          estado_anterior: cita.estado,
          estado_nuevo: 'Atendida',
          fecha_cambio: new Date().toISOString(),
          motivo: 'Consulta registrada',
        });
        cita.estado = 'Atendida';
      }
    }

    return { data: nueva };
  }

  return { data: [] };
}

function handleHistorialCitas(method, params) {
  if (method === 'GET') {
    const data = store.historial_citas.filter((hist) => hist.id_cita_fk === params?.id_cita_fk);
    return { data };
  }

  return { data: [] };
}
