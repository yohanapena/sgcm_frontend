import { apiGateway, USE_MOCKS } from '../../api/apiGateway.js';
import { mountMedicoModule } from '../medico/medicoModule.js';
import { mountAdminModule } from '../admin/adminModule.js';
import { mountAdministradorModule, renderUsers as renderAdministradorUsers } from '../administrador/administradorModule.js';
import { mountPacientesModule } from '../pacientes/pacientesModule.js';
import { mountAgendaModule } from '../citas/citasModule.js';
import { findLocalUser } from '../administrador/administradorStore.js';

let authenticatedUser = null;

export function getAuthenticatedUser() {
  return authenticatedUser;
}

export async function fetchAuthenticatedUserProfile() {
  return apiGateway({ resource: 'auth/me', method: 'GET' });
}

function formatUserDisplayName(user) {
  if (!user) return '';
  const firstName = user.nombre || user.name || user.firstName || user.username || '';
  const lastName = user.apellido || user.primer_apellido || user.segundo_apellido || user.lastName || '';
  const baseName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = baseName || user.email || 'Usuario';

  const roleString = (user.rol || '').toString().toLowerCase();
  if (roleString.includes('medic') || roleString.includes('doctor')) {
    return displayName.startsWith('Dr.') || displayName.startsWith('Dr ') ? displayName : `Dr. ${displayName}`;
  }
  return displayName;
}

function isBackendUnavailable(error) {
  const message = String(error.message || '').toLowerCase();
  return message.includes('network_error') || message.includes('failed to fetch') || message.includes('no se pudo conectar') || message.includes('networkerror');
}

function shouldUseLocalFallback(error) {
  return isBackendUnavailable(error);
}

function isAdministrativeStaffRole(role) {
  if (!role) return false;
  const normalized = role.toString().trim().toLowerCase();
  return normalized === 'administrativo' || normalized === 'administrative' || normalized === 'administrative staff';
}

function isSystemAdministratorRole(role) {
  if (!role) return false;
  const normalized = role.toString().trim().toLowerCase();
  return normalized === 'administrador' || normalized === 'admin' || normalized === 'administrator';
}

function isMedicoRole(role) {
  if (!role) return false;
  const normalized = role.toString().trim().toLowerCase();
  return normalized === 'médico' || normalized === 'medico' || normalized === 'doctor';
}

function isAdminRole(role) {
  return isAdministrativeStaffRole(role) || isSystemAdministratorRole(role);
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    rol: user.rol || user.role || user.userRole || user.user_role,
    nombre: user.nombre || user.name || user.username || user.userName || user.user_name,
    apellido: user.apellido || user.primer_apellido || user.segundo_apellido || user.lastName || user.last_name,
    especialidad: user.especialidad || user.speciality || user.specialty || user.medicalSpecialty || user.specialization,
    id_usuario: user.id_usuario || user.idUsuario || user.userId || user.user_id,
    id_medico: user.id_medico || user.id_medico_fk || user.idMedico || user.medicoId || user.medico_id,
    email: user.email || user.correo || user.userEmail || user.user_email,
  };
}

function fallbackLocalLogin({ usuario, contrasena }) {
  const user = findLocalUser(usuario, contrasena);

  if (!user) {
      return { success: false, error: 'Usuario o contraseña incorrectos' };
  }

  if (user.status !== 'Activo') {
      return { success: false, error: 'Usuario inactivo', statusCode: 401 };
  }

  return { success: true, token: 'mock-jwt-token', user, backendFallback: true };
}

export async function login({ usuario, contrasena }) {

  if (USE_MOCKS) {
    // En modo mock usamos el gateway (→ mockApi) para mantener el mismo contrato que el backend real
    try {
      console.log('[DEBUG] Intentando login con mock:', { usuario, contrasena });
      const response = await apiGateway({
        resource: 'auth/login',
        method: 'POST',
        params: { usuario, contrasena },
      });
      console.log('[DEBUG] Respuesta del mock:', response);
      const { token, user: rawUser, usuario: rawUsuario } = response ?? {};
      const userRaw = rawUser || rawUsuario;
      if (!token || !userRaw) {
        console.error('[DEBUG] Respuesta inválida:', { token, userRaw });
        return { success: false, error: 'Respuesta inválida del servidor.' };
      }
      console.log('[DEBUG] Login exitoso:', { token, user: userRaw });
      return { success: true, token, user: normalizeUser(userRaw) };
    } catch (error) {
      console.error('[DEBUG] Error en login mock:', error);
      if (shouldUseLocalFallback(error)) {
        console.warn('[auth] usando fallback local — solo válido en desarrollo');
        const localResult = fallbackLocalLogin({ usuario, contrasena });
        if (localResult.success) {
          localResult.user = normalizeUser(localResult.user);
          return { ...localResult, backendFallback: true };
        }
        return { success: false, error: localResult.error || 'Usuario o contraseña incorrectos' };
      }
      return { success: false, error: error.message || 'No se pudo iniciar sesión.' };
    }
  }

  try {
    const response = await apiGateway({
      resource: 'auth/login',
      method: 'POST',
      params: { usuario, contrasena },
    });

    const { token, user: rawUser, usuario: rawUsuario } = response;
    const userRaw = rawUser || rawUsuario;
    if (!token || !userRaw) {
      return { success: false, error: 'Respuesta inválida del servidor.' };
    }

    const user = normalizeUser(userRaw);
    return { success: true, token, user };
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      console.warn('[auth] usando fallback local — solo válido en desarrollo');
      const localResult = fallbackLocalLogin({ usuario, contrasena });
      if (localResult.success) {
        localResult.user = normalizeUser(localResult.user);
        return localResult;
      }
      return { success: false, error: localResult.error || 'Usuario o contraseña incorrectos' };
    }
    return { success: false, error: error.message || 'No se pudo iniciar sesión.' };
  }
}

async function loadAuthenticatedUserProfile() {
  try {
    const profileResponse = await fetchAuthenticatedUserProfile();
    const user = normalizeUser(profileResponse.user || profileResponse);
    return user;
  } catch (error) {
    console.warn('No se pudo cargar perfil de usuario autenticado:', error.message || error);
    return null;
  }
}

export async function mountAuth() {
  try {
    const form = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const backendStatus = document.getElementById('login-backend-status');
    const logoutButton = document.getElementById('logout-btn');
    const appSection = document.getElementById('app-section');
    const loginSection = document.getElementById('login-section');
    const navItems = Array.from(document.querySelectorAll('.sidebar-item'));

    if (!form || !appSection || !loginSection) {
      throw new Error('Elementos de autenticación no encontrados en el DOM');
    }

  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      loginError.classList.add('d-none');
      if (backendStatus) {
        backendStatus.classList.add('d-none');
      }

      const usuario = document.getElementById('username').value.trim();
      const contrasena = document.getElementById('password').value.trim();

      if (!usuario || !contrasena) {
        loginError.textContent = 'Usuario y contraseña son requeridos';
        loginError.classList.remove('d-none');
        return;
      }

      const result = await login({ usuario, contrasena });

      if (!result.success) {
        loginError.textContent = result.error || 'Usuario o contraseña incorrectos';
        loginError.classList.remove('d-none');
        return;
      }

      if (result.backendFallback && backendStatus) {
        backendStatus.classList.remove('d-none');
      }

      const { user, token } = result;
      const normalizedUser = normalizeUser(user);
              setSessionStorage(normalizedUser, token);
      await handleSuccessfulLogin(normalizedUser);
    });

    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        clearSessionStorage();
        appSection.classList.remove('active');
        loginSection.classList.add('active');
        form.reset();
        loginError.classList.add('d-none');
        navItems.forEach((item) => item.classList.remove('active'));
      });
    }

    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const sectionId = item.getAttribute('data-section');
        if (!item.classList.contains('disabled')) {
          navigateTo(sectionId);
        }
      });
    });

    window.addEventListener('administrador-users-updated', updateAdministradorDashboardCounts);

    await restoreSession();
  } catch (error) {
    console.error('Error en mountAuth:', error);
    const loginError = document.getElementById('login-error');
    if (loginError) {
      loginError.textContent = 'Error al inicializar autenticación: ' + error.message;
      loginError.classList.remove('d-none');
    }
  }
}

async function restoreSession() {
  const token = localStorage.getItem('jwtToken');
  const role = localStorage.getItem('userRole');
  const nombre = localStorage.getItem('userName');

  if (!token || !role || !nombre) {
    return;
  }

  const userFromStorage = localStorage.getItem('authUser');
  let user = null;

  if (token && token !== 'mock-jwt-token') {
    user = await loadAuthenticatedUserProfile();
  }

  if (!user && userFromStorage) {
    try {
      user = normalizeUser(JSON.parse(userFromStorage));
    } catch {
      user = null;
    }
  }

  if (!user) {
    clearSessionStorage();
    return;
  }

  await handleSuccessfulLogin(user, true);
}

function setSessionStorage(user, token) {
  const normalizedUser = normalizeUser(user);
  localStorage.setItem('jwtToken', token);
  localStorage.setItem('userRole', normalizedUser.rol);
  localStorage.setItem('userName', normalizedUser.nombre);
  localStorage.setItem('authUser', JSON.stringify(normalizedUser));

  if (normalizedUser.id_usuario) {
    localStorage.setItem('userId', String(normalizedUser.id_usuario));
  }

  if (normalizedUser.id_medico) {
    localStorage.setItem('userMedicoId', String(normalizedUser.id_medico));
  }
}

function clearSessionStorage() {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('userMedicoId');
  localStorage.removeItem('authUser');
}

async function handleSuccessfulLogin(user, isRestoring = false) {
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');

  if (userName && userRole) {
    userName.textContent = formatUserDisplayName(user);
    userRole.textContent = user.especialidad ? `${user.rol} • ${user.especialidad}` : user.rol;
  }

  authenticatedUser = normalizeUser(user);

  try {
    if (isMedicoRole(user.rol)) {
        await mountMedicoModule(user);
    } else if (isAdministrativeStaffRole(user.rol)) {
        await mountAdminModule(user);
      await mountPacientesModule();
      await mountAgendaModule();
    } else if (isSystemAdministratorRole(user.rol)) {
        await mountAdministradorModule();
    } else {
      console.error('Rol no reconocido:', user.rol);
    }
  } catch (moduleError) {
    console.error('❌ Error al cargar módulos:', moduleError);
  }

  updateDashboardForRole(user.rol, user.nombre);
  updateNavByRole(user.rol);

  loginSection.classList.remove('active');
  appSection.classList.add('active');

  navigateTo(getInitialSectionForRole(user.rol));
}

function getInitialSectionForRole(role) {
  return 'dashboard';
}

// ✅ CORRECCIÓN: función navigateTo declarada correctamente
function navigateTo(sectionId) {

  const appSection = document.getElementById('app-section');
  const loginSection = document.getElementById('login-section');
  if (appSection) {
    appSection.classList.add('active');
  }
  if (loginSection) {
    loginSection.classList.remove('active');
  }

  const contentSections = Array.from(document.querySelectorAll('.content-section')).filter(
    section => section.id !== 'app-section' && section.id !== 'login-section'
  );
  contentSections.forEach(section => {
    section.classList.remove('active');
  });

  const targetSection = document.getElementById(sectionId + '-section') || document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  } else {
    console.warn('No se encontró la sección:', sectionId + '-section');
  }

  const navItems = document.querySelectorAll('.sidebar-item');
  navItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
  });

}

function updateDashboardForRole(role, nombre) {
  const title = document.getElementById('dashboard-title');
  const subtitle = document.getElementById('dashboard-subtitle');

  if (!title || !subtitle) {
    return;
  }

  if (isSystemAdministratorRole(role)) {
    title.textContent = 'Panel Administrador del Sistema';
    subtitle.textContent = `Bienvenido ${nombre}. Gestiona usuarios y roles del sistema.`;
  } else if (isAdministrativeStaffRole(role)) {
    title.textContent = 'Dashboard Administrativo';
    subtitle.textContent = `Bienvenido ${nombre}. Administra pacientes, citas e historia clínica.`;
  } else {
    title.textContent = 'Dashboard Médico';
    subtitle.textContent = `Bienvenido ${nombre}. Revisa tus citas del día y registra consultas.`;
  }

  toggleDashboardRolePanels(role);
}

function toggleDashboardRolePanels(role) {
  const medicoPanel = document.getElementById('medico-dashboard-content');
  const administrativoPanel = document.getElementById('administrativo-dashboard-content');
  const administradorPanel = document.getElementById('administrador-dashboard-content');

  if (medicoPanel) medicoPanel.classList.toggle('d-none', !isMedicoRole(role));
  if (administrativoPanel) administrativoPanel.classList.toggle('d-none', !isAdministrativeStaffRole(role));
  if (administradorPanel) administradorPanel.classList.toggle('d-none', !isSystemAdministratorRole(role));

  if (isSystemAdministratorRole(role)) {
    setupAdministradorDashboardActions();
    updateAdministradorDashboardCounts();
  }
}

function setupAdministradorDashboardActions() {
  const activeUsersCard = document.getElementById('administrador-active-users-card');
  const inactiveUsersCard = document.getElementById('administrador-inactive-users-card');
  const rolesCard = document.getElementById('administrador-roles-card');

  if (activeUsersCard) {
    activeUsersCard.onclick = async () => {
      navigateTo('users');
      await renderAdministradorUsers('Activo');
    };
  }
  if (inactiveUsersCard) {
    inactiveUsersCard.onclick = async () => {
      navigateTo('users');
      await renderAdministradorUsers('Inactivo');
    };
  }
  if (rolesCard) {
    rolesCard.onclick = async () => {
      navigateTo('users');
      await renderAdministradorUsers(null);
    };
  }
}

async function updateAdministradorDashboardCounts() {
  const activeUsersCount = document.getElementById('administrador-active-users-count');
  const inactiveUsersCount = document.getElementById('administrador-inactive-users-count');

  try {
    const users = await apiGateway({ resource: 'auth/usuarios', method: 'GET' }) ?? [];
    const activeCount = users.filter((u) => u.status === 'Activo').length;
    const inactiveCount = users.filter((u) => u.status === 'Inactivo').length;
    if (activeUsersCount) activeUsersCount.textContent = String(activeCount);
    if (inactiveUsersCount) inactiveUsersCount.textContent = String(inactiveCount);
  } catch {
    // Fallback al store local si el gateway falla (modo mock sin endpoint)
    const { getLocalUsers } = await import('../administrador/administradorStore.js');
    const users = getLocalUsers();
    const activeCount = users.filter((u) => u.status === 'Activo').length;
    const inactiveCount = users.filter((u) => u.status === 'Inactivo').length;
    if (activeUsersCount) activeUsersCount.textContent = String(activeCount);
    if (inactiveUsersCount) inactiveUsersCount.textContent = String(inactiveCount);
  }
}

function updateNavByRole(role) {
  const administrativoSections = ['dashboard', 'patients', 'appointments', 'agenda'];
  const administradorSections = ['dashboard', 'users'];
  const medicoSections = ['dashboard', 'mis-citas', 'clinical-history'];
  let allowed = [];

  if (isSystemAdministratorRole(role)) {
    allowed = administradorSections;
  } else if (isAdministrativeStaffRole(role)) {
    allowed = administrativoSections;
  } else if (isMedicoRole(role)) {
    allowed = medicoSections;
  }

  document.querySelectorAll('.sidebar-item').forEach((item) => {
    const sectionId = item.getAttribute('data-section');
    if (!allowed.includes(sectionId)) {
      item.classList.add('disabled');
      item.style.pointerEvents = 'none';
      item.style.opacity = '0.4';
      item.style.display = 'none';
    } else {
      item.classList.remove('disabled');
      item.style.pointerEvents = '';
      item.style.opacity = '';
      item.style.display = '';
    }
  });
}

function showHideSections(activeSection) {
  document.querySelectorAll('.content-section').forEach((section) => {
    if (activeSection && section.id === `${activeSection}-section`) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });
}

export function loadModule(moduleName, params = {}) {
  if (moduleName === 'historia-clinica' && params.idPaciente) {
    navigateTo('clinical-history');
    const event = new CustomEvent('load-patient-history', { detail: { patientId: params.idPaciente } });
    window.dispatchEvent(event);
  }
}

window.loadModule = loadModule;