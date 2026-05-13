const isDevMode = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development';

export let localUsers = [];

if (isDevMode) {
  // TODO: remover en producción
  const { MOCK_USERS } = await import('../../mocks/mockUsers.js');
  localUsers = Array.isArray(MOCK_USERS) ? MOCK_USERS : [];
}

export function getLocalUsers() {
  return localUsers;
}

export function findLocalUser(usuario, contrasena) {
  if (!usuario || !contrasena) return undefined;
  const normalizedUsuario = usuario.toString().trim().toLowerCase();
  return localUsers.find(
    (user) => user.usuario.toString().trim().toLowerCase() === normalizedUsuario && user.contrasena === contrasena
  );
}

export function findLocalUserByUsername(usuario) {
  if (!usuario) return undefined;
  const normalizedUsuario = usuario.toString().trim().toLowerCase();
  return localUsers.find((user) => user.usuario.toString().trim().toLowerCase() === normalizedUsuario);
}

export function createLocalUser(payload) {
  const id = localUsers.length ? Math.max(...localUsers.map((user) => user.id_usuario)) + 1 : 1;
  const newUser = {
    id_usuario: id,
    rol: 'Administrativo',
    status: 'Activo',
    nombre: payload.nombre || payload.usuario || 'Usuario',
    ...payload,
  };
  localUsers.push(newUser);
  return newUser;
}

export function updateLocalUser(id, updates) {
  const index = localUsers.findIndex((user) => user.id_usuario === id);
  if (index === -1) return null;
  localUsers[index] = {
    ...localUsers[index],
    ...updates,
  };
  return localUsers[index];
}

export function toggleLocalUserStatus(id) {
  const user = localUsers.find((item) => item.id_usuario === id);
  if (!user) return null;
  user.status = user.status === 'Activo' ? 'Inactivo' : 'Activo';
  return user;
}
