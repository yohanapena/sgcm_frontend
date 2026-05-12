// Mock data alineado al SRS — solo Medicina General y Odontología
const MOCK_CITAS = [
  {
    id_cita: 1,
    id_paciente_fk: 1,
    id_medico_fk: 1,
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    estado: 'Agendada',
    observacion: 'Control de rutina',
    especialidad: 'Medicina General',
    paciente_nombre: 'Ana',
    paciente_apellido: 'Martínez',
    medico_nombre: 'Carlos Ramírez',
  },
  {
    id_cita: 2,
    id_paciente_fk: 2,
    id_medico_fk: 3,
    fecha: new Date().toISOString().split('T')[0],
    hora: '10:00',
    estado: 'Agendada',
    observacion: 'Revisión dental',
    especialidad: 'Odontología',
    paciente_nombre: 'Juan',
    paciente_apellido: 'Pérez',
    medico_nombre: 'Pedro Sánchez',
  },
  {
    id_cita: 3,
    id_paciente_fk: 3,
    id_medico_fk: 1,
    fecha: new Date().toISOString().split('T')[0],
    hora: '11:00',
    estado: 'Cancelada',
    observacion: 'Síntomas de gripe',
    especialidad: 'Medicina General',
    paciente_nombre: 'María',
    paciente_apellido: 'González',
    medico_nombre: 'Carlos Ramírez',
  },
];

const MOCK_MEDICOS = [
  { id_medico: 1, nombre: 'Carlos', primer_apellido: 'Ramírez', especialidad: 'Medicina General' },
  { id_medico: 2, nombre: 'Laura',  primer_apellido: 'Gómez',   especialidad: 'Medicina General' },
  { id_medico: 3, nombre: 'Pedro',  primer_apellido: 'Sánchez', especialidad: 'Odontología' },
  { id_medico: 4, nombre: 'Ana',    primer_apellido: 'Torres',  especialidad: 'Odontología' },
];

const MOCK_ESPECIALIDADES = [
  { id_especialidad: 1, nombre: 'Medicina General' },
  { id_especialidad: 2, nombre: 'Odontología' },
];

const MOCK_ESTADOS = ['Agendada', 'Atendida', 'Cancelada'];

// Cache en memoria para modificaciones mock
let citasCache = [...MOCK_CITAS];

// ✅ FUNCIÓN AGREGADA — faltaba en el archivo original
export async function createCita(data) {
  try {
    const response = await fetch('http://localhost:8000/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Backend error');
    return { data: await response.json(), success: true };
  } catch (error) {
    console.warn('Backend no disponible, simulando creación:', error.message);

    // Fallback mock
    const nuevaCita = {
      id_cita: Date.now(),
      ...data,
      estado: 'Agendada',
      fecha_creacion: new Date().toISOString(),
    };
    citasCache.push(nuevaCita);
    return { data: nuevaCita, success: true };
  }
}

export async function getCitasFiltradas(filtros = {}) {
  try {
    const response = await fetch('http://localhost:8000/citas/filtradas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtros),
    });

    if (!response.ok) throw new Error('Backend error');
    return await response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando mock data:', error.message);

    let filtered = [...citasCache];

    if (filtros.estado && filtros.estado !== 'Todas') {
      filtered = filtered.filter((c) => c.estado === filtros.estado);
    }
    if (filtros.especialidad) {
      filtered = filtered.filter((c) => c.especialidad === filtros.especialidad);
    }
    if (filtros.medico) {
      filtered = filtered.filter((c) => c.id_medico_fk === Number(filtros.medico));
    }
    if (filtros.fecha_inicio) {
      filtered = filtered.filter((c) => c.fecha >= filtros.fecha_inicio);
    }
    if (filtros.fecha_fin) {
      filtered = filtered.filter((c) => c.fecha <= filtros.fecha_fin);
    }
    if (filtros.paciente_nombre) {
      const query = filtros.paciente_nombre.toLowerCase();
      filtered = filtered.filter((c) =>
        `${c.paciente_nombre} ${c.paciente_apellido}`.toLowerCase().includes(query)
      );
    }

    // Ordenar por fecha y hora ascendente
    filtered.sort((a, b) => {
      const dateA = `${a.fecha} ${a.hora}`;
      const dateB = `${b.fecha} ${b.hora}`;
      return dateA.localeCompare(dateB);
    });

    return { data: filtered, success: true };
  }
}

export async function getCita(id) {
  try {
    const response = await fetch(`http://localhost:8000/citas/${id}`);
    if (!response.ok) throw new Error('Backend error');
    return await response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando mock data:', error.message);
    const cita = citasCache.find((c) => c.id_cita === Number(id));
    return cita ? { data: cita, success: true } : null;
  }
}

export async function updateCita(id, data) {
  try {
    const response = await fetch(`http://localhost:8000/citas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Backend error');
    return { data: await response.json(), success: true };
  } catch (error) {
    console.warn('Backend no disponible, usando mock data:', error.message);

    const index = citasCache.findIndex((c) => c.id_cita === Number(id));
    if (index === -1) throw new Error('Cita no encontrada');

    citasCache[index] = { ...citasCache[index], ...data };
    return { data: citasCache[index], success: true };
  }
}

export async function cancelarCita(id, motivo) {
  try {
    const response = await fetch(`http://localhost:8000/citas/${id}/cancelar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo, estado: 'Cancelada' }),
    });
    if (!response.ok) throw new Error('Backend error');
    return { data: await response.json(), success: true };
  } catch (error) {
    console.warn('Backend no disponible, usando mock data:', error.message);

    const index = citasCache.findIndex((c) => c.id_cita === Number(id));
    if (index === -1) throw new Error('Cita no encontrada');

    citasCache[index] = { ...citasCache[index], estado: 'Cancelada', observacion: motivo };
    return { data: citasCache[index], success: true };
  }
}

export async function registrarHistorialCita(data) {
  // data: { id_cita_fk, estado_anterior, estado_nuevo, motivo }
  try {
    const response = await fetch(`http://localhost:8000/historial-citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Backend error');
    return { data: await response.json(), success: true };
  } catch (error) {
    console.warn('Backend no disponible, simulando historial:', error.message);
    // Mock: solo loguear, el estado ya fue actualizado en cancelarCita/updateCita
    return {
      data: {
        id_historial: Date.now(),
        ...data,
        fecha_cambio: new Date().toISOString(),
      },
      success: true,
    };
  }
}

export async function getMedicos() {
  try {
    const response = await fetch('http://localhost:8000/medicos');
    if (!response.ok) throw new Error('Backend error');
    return await response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando mock data:', error.message);
    return { data: MOCK_MEDICOS, success: true };
  }
}

export async function getEspecialidades() {
  try {
    const response = await fetch('http://localhost:8000/especialidades');
    if (!response.ok) throw new Error('Backend error');
    return await response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando mock data:', error.message);
    return { data: MOCK_ESPECIALIDADES, success: true };
  }
}

export async function getEstados() {
  try {
    const response = await fetch('http://localhost:8000/citas/estados');
    if (!response.ok) throw new Error('Backend error');
    return await response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando mock data:', error.message);
    return { data: MOCK_ESTADOS, success: true };
  }
}