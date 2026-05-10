export const localUsers = [
  {
    id_usuario: 1,
    usuario: 'admin1',
    contrasena: 'password123',
    rol: 'Administrativo',
    nombre: 'María Pérez',
    status: 'Activo',
    created_at: '2026-01-01 10:00:00',
    updated_at: '2026-01-01 10:00:00',
  },
  {
    id_usuario: 2,
    usuario: 'admin2',
    contrasena: 'password123',
    rol: 'Administrador',
    nombre: 'Andrés Gómez',
    status: 'Activo',
    created_at: '2026-01-02 11:00:00',
    updated_at: '2026-01-02 11:00:00',
  },
  {
    id_usuario: 3,
    usuario: 'medico1',
    contrasena: 'password123',
    rol: 'Médico',
    nombre: 'Dr. Juan Díaz',
    id_medico_fk: 2,
    status: 'Activo',
    created_at: '2026-01-03 12:00:00',
    updated_at: '2026-01-03 12:00:00',
  },
];

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
