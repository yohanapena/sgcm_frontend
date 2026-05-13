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
      sexo: 'F',
      tipo_sangre: 'O+',
      alergias: ['Ninguna'],
      antecedentes: 'Hipertensión arterial leve. Sin cirugías previas.',
      contactos: [
        { tipo: 'celular', dato_contacto: '321-456-7890' },
        { tipo: 'email', dato_contacto: 'maria@example.com' },
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
      sexo: 'M',
      tipo_sangre: 'A+',
      alergias: ['Penicilina'],
      antecedentes: 'Diabetes tipo 2 controlada con dieta y medicación.',
      contactos: [
        { tipo: 'celular', dato_contacto: '310-123-4567' },
        { tipo: 'email', dato_contacto: 'juan@example.com' },
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
      sexo: 'F',
      tipo_sangre: 'B+',
      alergias: [],
      antecedentes: 'Paciente sin antecedentes médicos relevantes.',
      contactos: [
        { tipo: 'celular', dato_contacto: '300-555-1234' },
        { tipo: 'email', dato_contacto: 'ana@example.com' },
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
  signos_vitales: [],
  eps: EPS,

  regimenes: REGIMENES,
  especialidades: ESPECIALIDADES,
  servicios: SERVICIOS,
  horarios: HORARIOS,
  estados: [
    { id: 1, nombre: 'Pendiente' },
    { id: 2, nombre: 'Atendida' },
    { id: 3, nombre: 'Cancelada' },
    { id: 4, nombre: 'No asistió' },
  ],
};

export function initializeMockApi() {
  console.log('Mock API inicializada');
}

export async function apiRequest({ resource, method = 'GET', params } = {}) {
  const normalizedResource = typeof resource === 'string' ? resource.replace(/^\/+/, '') : '';
  const [root, secondSegment, thirdSegment] = normalizedResource.split('/');
  const resourceId = secondSegment && !Number.isNaN(Number(secondSegment)) ? Number(secondSegment) : null;

  switch (root) {
    case 'auth':
      return handleAuth(method, secondSegment, params);
    case 'eps':
      return { data: store.eps };
    case 'regimenes':
      return { data: store.regimenes };
    case 'especialidades':
      return { data: store.especialidades };
    case 'servicios':
      return { data: store.servicios };
    case 'medicos':
      return handleMedicos(method, params, resourceId);
    case 'horarios':
      if (params?.medico_id) {
        const medicoId = Number(params.medico_id);
        return { data: store.horarios.filter(h => h.id_medico_fk === medicoId) };
      }
      return { data: store.horarios };
    case 'estados':
      return { data: store.estados };
    case 'pacientes':
      return handlePacientes(method, params, resourceId);
    case 'citas':
      return handleCitas(method, params, resourceId, thirdSegment);
    case 'consultas':
      return handleConsultas(method, params);
    case 'historial_citas':
      return handleHistorialCitas(method, params);
    case 'historias_clinicas':
      return handleHistoriasClinicas(method, params);
    case 'signos_vitales':
      return handleSignosVitales(method, params);
    default:
      return { data: [] };
  }
}

export async function getPacientes(params) {
  return apiRequest({ resource: 'pacientes', method: 'GET', params });
}

export async function getCitas(params) {
  return apiRequest({ resource: 'citas', method: 'GET', params });
}

export async function getMedicos(params) {
  return apiRequest({ resource: 'medicos', method: 'GET', params });
}

// mantenemos la firma y el final de archivo sin llaves extra

function handleAuth(method, action, params) {
  if (method === 'POST' && action === 'login') {
    const username = params?.usuario?.toString();
    const password = params?.contrasena?.toString();

    // Credenciales de desarrollo
    if ((username === 'admin' && password === '1234') ||
        (username === 'admin1' && password === 'password123') ||
        (username === 'admin2' && password === 'password123') ||
        (username === 'medico1' && password === 'password123')) {
      let userData;
      if (username === 'admin' || username === 'admin1') {
        userData = {
          id_usuario: 1,
          usuario: username,
          rol: 'Administrativo',
          nombre: 'María Pérez',
        };
      } else if (username === 'admin2') {
        userData = {
          id_usuario: 2,
          usuario: username,
          rol: 'Administrador',
          nombre: 'Andrés Gómez',
        };
      } else if (username === 'medico1') {
        userData = {
          id_usuario: 3,
          usuario: username,
          rol: 'Médico',
          nombre: 'Dr. Juan Díaz',
          id_medico_fk: 2,
        };
      }

      return {
        data: {
          token: 'jwt_token_mock',
          user: userData,
        },
      };
    }

    throw new Error('Usuario o contraseña incorrectos');
  }

  if (method === 'GET' && action === 'me') {
    return {
      data: {
        id_usuario: 1,
        usuario: 'admin',
        rol: 'Administrativo',
      },
    };
  }

  return { data: null };
}

function handlePacientes(method, params, resourceId) {
  if (method === 'GET') {
    if (resourceId) {
      const paciente = store.pacientes.find((item) => item.id_paciente === resourceId);
      return { data: paciente ?? null };
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
    const nuevo = {
      id_paciente: store.pacientes.length ? Math.max(...store.pacientes.map((paciente) => paciente.id_paciente)) + 1 : 1,
      sexo: params?.sexo ?? null,
      tipo_sangre: params?.tipo_sangre ?? null,
      alergias: Array.isArray(params?.alergias) ? params.alergias : [],
      antecedentes: params?.antecedentes ?? '',
      contactos: Array.isArray(params?.contactos) ? params.contactos : [],
      ...params,
    };
    store.pacientes.push(nuevo);
    return { data: nuevo };
  }

  if (method === 'PUT') {
    const pacienteId = resourceId || params?.id_paciente;
    const index = store.pacientes.findIndex((paciente) => paciente.id_paciente === pacienteId);
    if (index === -1) {
      return { data: null };
    }
    store.pacientes[index] = {
      ...store.pacientes[index],
      ...params,
      sexo: params?.sexo ?? store.pacientes[index].sexo,
      tipo_sangre: params?.tipo_sangre ?? store.pacientes[index].tipo_sangre,
      alergias: params?.alergias ?? store.pacientes[index].alergias,
      antecedentes: params?.antecedentes ?? store.pacientes[index].antecedentes,
      contactos: Array.isArray(params?.contactos) ? params.contactos : store.pacientes[index].contactos,
    };
    return { data: store.pacientes[index] };
  }

  return { data: [] };
}

function handleMedicos(method, params, resourceId) {
  if (method === 'GET') {
    if (resourceId) {
      const medico = store.medicos.find((item) => item.id_medico === resourceId);
      return { data: medico ? [medico] : [] };
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
    const medicoId = resourceId || params?.id_medico;
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

function handleCitas(method, params, resourceId, action) {
  if (method === 'GET') {
    if (resourceId) {
      const cita = store.citas.find((item) => item.id_cita === resourceId);
      return { data: cita ?? null };
    }

    const data = store.citas.filter((cita) => {
      if (!params) return true;
      if (params.medicoId && cita.id_medico_fk !== params.medicoId) return false;
      if (params.pacienteId && cita.id_paciente_fk !== params.pacienteId) return false;
      if (params.estado && params.estado !== 'Todas' && params.estado !== '') return cita.estado === params.estado;
      return true;
    });
    return { data };
  }

  if (method === 'POST') {
    const nuevo = {
      id_cita: store.citas.length ? Math.max(...store.citas.map((cita) => cita.id_cita)) + 1 : 1,
      estado: 'Agendada',
      ...params,
    };
    store.citas.push(nuevo);
    store.historial_citas.push({
      id_historial: store.historial_citas.length + 1,
      id_cita_fk: nuevo.id_cita,
      estado: 'Agendada',
      fecha: new Date().toISOString(),
    });
    return { data: nuevo };
  }

  if (method === 'PUT') {
    if (action === 'cancelar' && resourceId) {
      const index = store.citas.findIndex((item) => item.id_cita === resourceId);
      if (index === -1) {
        return { data: null };
      }
      store.citas[index] = {
        ...store.citas[index],
        estado: 'Cancelada',
        observacion: params?.motivo || store.citas[index].observacion,
      };
      return { data: store.citas[index] };
    }

    const citaId = resourceId || params?.id_cita;
    const index = store.citas.findIndex((item) => item.id_cita === citaId);
    if (index === -1) {
      return { data: null };
    }
    store.citas[index] = {
      ...store.citas[index],
      ...params,
      estado: params?.estado || store.citas[index].estado,
    };
    return { data: store.citas[index] };
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

    if (params?.id_cita_fk) {
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

function handleHistoriasClinicas(method, params) {
  if (method === 'GET') {
    if (params?.pacienteId) {
      const data = store.historias_clinicas.filter((h) => h.id_paciente_fk === params.pacienteId);
      return { data };
    }
    if (params?.id_paciente_fk) {
      const data = store.historias_clinicas.filter((h) => h.id_paciente_fk === params.id_paciente_fk);
      return { data };
    }
    return { data: store.historias_clinicas };
  }

  if (method === 'POST') {
    const id = store.historias_clinicas.length
      ? Math.max(...store.historias_clinicas.map((h) => h.id_historia_clinica)) + 1
      : 1;

    const nuevo = {
      id_historia_clinica: id,
      resumen: params?.resumen || '',
      fecha_apertura: params?.fecha_apertura || new Date().toISOString().split('T')[0],
      id_paciente_fk: params?.id_paciente_fk,
    };

    store.historias_clinicas.push(nuevo);
    return { data: nuevo };
  }

  return { data: [] };
}

function handleSignosVitales(method, params) {
  if (method === 'POST') {
    const id = store.signos_vitales.length ? Math.max(...store.signos_vitales.map((s) => s.id_signos_vitales)) + 1 : 1;

    const nuevo = {
      id_signos_vitales: id,
      id_consulta_fk: params?.id_consulta_fk,
      peso: params?.peso ?? null,
      estatura: params?.estatura ?? null,
      temperatura: params?.temperatura ?? null,
      presion_arterial: params?.presion_arterial ?? null,
      frecuencia_cardiaca: params?.frecuencia_cardiaca ?? null,
      saturacion_oxigeno: params?.saturacion_oxigeno ?? null,
      fecha_registro: params?.fecha_registro || new Date().toISOString(),
    };

    store.signos_vitales.push(nuevo);
    return { data: nuevo };
  }

  if (method === 'GET') {
    if (params?.id_consulta_fk) {
      return { data: store.signos_vitales.filter((s) => s.id_consulta_fk === params.id_consulta_fk) };
    }
    return { data: store.signos_vitales };
  }

  return { data: [] };
}

