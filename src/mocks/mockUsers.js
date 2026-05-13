// Mock de usuarios para desarrollo local solamente.
// TODO: remover en producción
export const MOCK_USERS = [
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
