import { apiGateway, USE_MOCKS } from '../../api/apiGateway.js';
import { localUsers, createLocalUser, updateLocalUser, toggleLocalUserStatus } from './administradorStore.js';

// Este servicio es mock-first: en modo mock, provoca la ruta de fallback local.
// Cuando el backend esté disponible, apiGateway centraliza las llamadas HTTP.

function isBackendUnavailable(error) {
  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('connection refused') ||
    message.includes('network_error')
  );
}

export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const resource = path.startsWith('/') ? path.slice(1) : path;

  if (USE_MOCKS) {
    // En modo mock usamos el gateway (→ mockApi) para mantener el mismo contrato que el backend real.
    // Si mockApi no implementa el endpoint, lanzará un error que el llamador puede manejar.
    return apiGateway({ resource, method, params: body });
  }

  try {
    return await apiGateway({ resource, method, params: body });
  } catch (error) {
    if (isBackendUnavailable(error)) {
      throw new Error('NETWORK_ERROR: No se pudo conectar con el backend');
    }
    throw error;
  }
}

function normalizeUserRecord(user) {
  return {
    ...user,
    id_medico_fk: user.id_medico_fk ?? user.id_medico ?? null,
    id_medico: user.id_medico_fk ?? user.id_medico ?? null,
  };
}

export async function fetchUsers(statusFilter = null) {
  try {
    const data = await apiFetch('/auth/usuarios');
    const users = Array.isArray(data) ? data : [];
    return users
      .map(normalizeUserRecord)
      .filter((user) => {
        if (!statusFilter) return true;
        return user.status === statusFilter;
      });
  } catch (error) {
    if (isBackendUnavailable(error)) {
      const users = Array.isArray(localUsers) ? localUsers : [];
      return users
        .map(normalizeUserRecord)
        .filter((user) => {
          if (!statusFilter) return true;
          return user.status === statusFilter;
        });
    }
    throw error;
  }
}

export async function fetchMedicos() {
  try {
    const data = await apiFetch('/auth/medicos');
    const medicos = Array.isArray(data) ? data : [];
    return medicos.map((medico) => ({
      id_medico: medico.id_medico,
      nombre: medico.nombre,
      especialidad: medico.especialidad,
    }));
  } catch (error) {
    if (isBackendUnavailable(error)) {
      const response = await apiGateway({ resource: 'medicos', method: 'GET' });
      return (response || []).map((medico) => ({
        id_medico: medico.id_medico,
        nombre: medico.nombre,
        especialidad: medico.especialidad,
      }));
    }
    throw error;
  }
}

export async function saveMedico(payload) {
  try {
    const data = await apiFetch('/auth/medicos', {
      method: 'POST',
      body: payload,
    });
    return data;
  } catch (error) {
    if (isBackendUnavailable(error)) {
      const response = await apiGateway({ resource: 'medicos', method: 'POST', params: payload });
      return response;
    }
    throw error;
  }
}

export async function updateMedico(id_medico, payload) {
  try {
    const data = await apiFetch(`/auth/medicos/${id_medico}`, {
      method: 'PUT',
      body: payload,
    });
    return data;
  } catch (error) {
    if (isBackendUnavailable(error)) {
      const response = await apiGateway({ resource: 'medicos', method: 'PUT', params: { id_medico, ...payload } });
      return response;
    }
    throw error;
  }
}

export async function getUserById(id_usuario) {
  try {
    const data = await apiFetch(`/auth/usuarios/${id_usuario}`);
    return normalizeUserRecord(data);
  } catch (error) {
    if (isBackendUnavailable(error)) {
      const localUser = localUsers.find((item) => item.id_usuario === Number(id_usuario));
      if (!localUser) {
        throw new Error('Usuario no encontrado');
      }
      return normalizeUserRecord(localUser);
    }
    throw error;
  }
}

export async function saveUser(payload) {
  const normalizedPayload = {
    ...payload,
    id_usuario: payload.id_usuario ? Number(payload.id_usuario) : undefined,
    id_medico_fk: payload.id_medico_fk ? Number(payload.id_medico_fk) : null,
    usuario: payload.usuario?.toString().trim() ?? '',
    contrasena: payload.contrasena?.toString() ?? '',
    rol: payload.rol?.toString().trim() ?? '',
    status: payload.status?.toString().trim() ?? 'Activo',
    nombre: payload.nombre?.toString().trim() ?? '',
  };

  if (normalizedPayload.rol === 'Médico') {
    if (!normalizedPayload.id_medico_fk) {
      throw new Error('Debe seleccionar un médico válido para el rol Médico.');
    }
    // Validar el médico contra el gateway (mock o backend real), no contra el archivo local
    try {
      const medicos = await apiGateway({ resource: 'medicos', method: 'GET' });
      const lista = Array.isArray(medicos) ? medicos : (medicos?.data ?? []);
      const medico = lista.find((m) => m.id_medico === normalizedPayload.id_medico_fk);
      if (!medico) {
        throw new Error('El médico seleccionado no existe.');
      }
      normalizedPayload.nombre = medico.nombre;
    } catch (error) {
      if (!error.message.includes('no existe')) {
        // Error de red o gateway — dejar pasar y que el backend valide
        console.warn('No se pudo validar el médico localmente:', error.message);
      } else {
        throw error;
      }
    }
  } else {
    if (!normalizedPayload.nombre) {
      throw new Error('El nombre es obligatorio para roles administrativo o administrador.');
    }
  }

  if (normalizedPayload.id_usuario) {
    try {
      const data = await apiFetch(`/auth/usuarios/${normalizedPayload.id_usuario}`, {
        method: 'PUT',
        body: normalizedPayload,
      });
      return normalizeUserRecord(data);
    } catch (error) {
      if (isBackendUnavailable(error)) {
        const updated = updateLocalUser(normalizedPayload.id_usuario, {
          ...normalizedPayload,
          id_medico_fk: normalizedPayload.rol === 'Médico' ? normalizedPayload.id_medico_fk : null,
        });
        if (!updated) {
          throw new Error('Usuario no encontrado');
        }
        return normalizeUserRecord(updated);
      }
      throw error;
    }
  }

  try {
    const data = await apiFetch('/auth/usuarios', {
      method: 'POST',
      body: normalizedPayload,
    });
    return normalizeUserRecord(data);
  } catch (error) {
    if (isBackendUnavailable(error)) {
      const created = createLocalUser(normalizedPayload);
      return normalizeUserRecord(created);
    }
    throw error;
  }
}

export async function toggleUserStatus(id_usuario) {
  try {
    const currentUser = await getUserById(id_usuario);
    const newEstado = currentUser.status === 'Activo' ? 'Inactivo' : 'Activo';
    const data = await apiFetch(`/auth/usuarios/${id_usuario}/estado`, {
      method: 'PATCH',
      body: { estado: newEstado },
    });
    return normalizeUserRecord(data);
  } catch (error) {
    if (isBackendUnavailable(error)) {
      const updated = toggleLocalUserStatus(Number(id_usuario));
      if (!updated) {
        throw new Error('Usuario no encontrado');
      }
      return normalizeUserRecord(updated);
    }
    throw error;
  }
}