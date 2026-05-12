// Mock data para pacientes
const MOCK_PACIENTES = [
  {
    id_paciente: 1,
    numero_identificacion: '1020304050',
    nombre: 'Ana',
    primer_apellido: 'Martínez',
    segundo_apellido: 'López',
    fecha_de_nacimiento: '1990-05-15',
    direccion: 'Calle 10 #5-20',
    id_eps_fk: 1,
    id_regimen_fk: 1,
    sexo: 'F',
    tipo_sangre: 'O+',
    contactos: [
      { tipo: 'celular', dato_contacto: '3105551234' },
      { tipo: 'email', dato_contacto: 'ana@example.com' }
    ]
  },
  {
    id_paciente: 2,
    numero_identificacion: '1098765432',
    nombre: 'Juan',
    primer_apellido: 'Pérez',
    segundo_apellido: 'García',
    fecha_de_nacimiento: '1985-03-22',
    direccion: 'Carrera 5 #12-34',
    id_eps_fk: 2,
    id_regimen_fk: 1,
    sexo: 'M',
    tipo_sangre: 'A+',
    contactos: [
      { tipo: 'celular', dato_contacto: '3106667890' }
    ]
  },
  {
    id_paciente: 3,
    numero_identificacion: '1111111111',
    nombre: 'María',
    primer_apellido: 'González',
    segundo_apellido: 'López',
    fecha_de_nacimiento: '1995-08-10',
    direccion: 'Avenida 3 #8-15',
    id_eps_fk: 1,
    id_regimen_fk: 2,
    sexo: 'F',
    tipo_sangre: 'B+',
    contactos: []
  }
];

const MOCK_EPS = [
  { id_eps: 1, nombre: 'Sura' },
  { id_eps: 2, nombre: 'Sanitas' },
  { id_eps: 3, nombre: 'Compensar' },
  { id_eps: 4, nombre: 'Nueva EPS' }
];

const MOCK_REGIMENES = [
  { id_regimen: 1, nombre: 'Contributivo' },
  { id_regimen: 2, nombre: 'Subsidiado' }
];

// Simular almacenamiento local para desarrollo
let pacientesCache = [...MOCK_PACIENTES];

// GET /pacientes?q={query}
export async function searchPacientes(query) {
  try {
    if (!query || query.trim() === '') {
      return pacientesCache;
    }

    const response = await fetch(`http://localhost:8000/pacientes?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Error en búsqueda');
    return await response.json();
  } catch (error) {
    console.warn('Búsqueda en backend falló, usando mock:', error.message);
    const queryLower = query.toLowerCase();
    return pacientesCache.filter(p =>
      p.nombre.toLowerCase().includes(queryLower) ||
      p.primer_apellido.toLowerCase().includes(queryLower) ||
      p.numero_identificacion.includes(query)
    );
  }
}

// GET /pacientes/{id}
export async function getPaciente(id) {
  try {
    const response = await fetch(`http://localhost:8000/pacientes/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Error al obtener paciente');
    return await response.json();
  } catch (error) {
    console.warn('GET paciente en backend falló, usando mock:', error.message);
    return pacientesCache.find(p => p.id_paciente === id);
  }
}

// POST /pacientes
export async function createPaciente(data) {
  try {
    const response = await fetch('http://localhost:8000/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 409) {
        throw new Error('El número de identificación ya existe en el sistema');
      }
      throw new Error(errorData.detail || 'Error al crear paciente');
    }
    return await response.json();
  } catch (error) {
    console.warn('POST paciente en backend falló, usando mock:', error.message);
    if (pacientesCache.find(p => p.numero_identificacion === data.numero_identificacion)) {
      throw new Error('El número de identificación ya existe en el sistema');
    }
    const newPaciente = {
      id_paciente: Math.max(...pacientesCache.map(p => p.id_paciente), 0) + 1,
      ...data,
      contactos: data.contactos || []
    };
    pacientesCache.push(newPaciente);
    return newPaciente;
  }
}

// PUT /pacientes/{id}
export async function updatePaciente(id, data) {
  try {
    const response = await fetch(`http://localhost:8000/pacientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Error al actualizar paciente');
    return await response.json();
  } catch (error) {
    console.warn('PUT paciente en backend falló, usando mock:', error.message);
    const index = pacientesCache.findIndex(p => p.id_paciente === id);
    if (index !== -1) {
      pacientesCache[index] = { ...pacientesCache[index], ...data, id_paciente: id };
      return pacientesCache[index];
    }
    throw new Error('Paciente no encontrado');
  }
}

// GET /eps
export async function getEps() {
  try {
    const response = await fetch('http://localhost:8000/eps', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Error al obtener EPS');
    return await response.json();
  } catch (error) {
    console.warn('GET EPS en backend falló, usando mock:', error.message);
    return MOCK_EPS;
  }
}

// GET /regimenes
export async function getRegimenes() {
  try {
    const response = await fetch('http://localhost:8000/regimenes', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Error al obtener regímenes');
    return await response.json();
  } catch (error) {
    console.warn('GET regímenes en backend falló, usando mock:', error.message);
    return MOCK_REGIMENES;
  }
}
