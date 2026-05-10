import { apiRequest } from '../../api/realApi.js';
import { mountMedicoModule } from '../medico/medicoModule.js';
import { mountAdminModule } from '../admin/adminModule.js';
import { mountAdministradorModule, renderUsers as renderAdministradorUsers } from '../administrador/administradorModule.js';
import { mountPacientesModule } from '../pacientes/pacientesModule.js';
import { findLocalUser, getLocalUsers } from '../administrador/administradorStore.js';

function isBackendUnavailable(error) {
  const message = String(error.message || '').toLowerCase();
  return message.includes('network_error') || message.includes('failed to fetch') || message.includes('no se pudo conectar') || message.includes('networkerror');
}

function shouldUseLocalFallback(error) {
  const message = String(error.message || '').toLowerCase();
  return isBackendUnavailable(error) || message.includes('error de comunicación') || message.includes('cannot post') || message.includes('not found') || message.includes('internal server error');
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
    id_usuario: user.id_usuario || user.idUsuario || user.userId || user.user_id,
    id_medico: user.id_medico || user.id_medico_fk || user.idMedico || user.medicoId || user.medico_id,
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
  try {
    const response = await apiRequest({
      path: '/auth/login',
      method: 'POST',
      body: { usuario, contrasena },
    });

    const { token, user: rawUser } = response;
    if (!token || !rawUser) {
      return { success: false, error: 'Respuesta inválida del servidor.' };
    }

    const user = normalizeUser(rawUser);
    return { success: true, token, user };
  } catch (error) {
    const localResult = fallbackLocalLogin({ usuario, contrasena });
    if (localResult.success) {
      localResult.user = normalizeUser(localResult.user);
      return localResult;
    }
    if (shouldUseLocalFallback(error)) {
      return localResult;
    }
    return { success: false, error: error.message || 'No se pudo iniciar sesión.' };
  }
}

export async function mountAuth() {
  const form = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const backendStatus = document.getElementById('login-backend-status');
  const logoutButton = document.getElementById('logout-btn');
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const appSection = document.getElementById('app-section');
  const loginSection = document.getElementById('login-section');
  const navItems = Array.from(document.querySelectorAll('.sidebar-item'));

  if (!form || !appSection || !loginSection) {
    console.warn('Elementos de autenticación no encontrados');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.classList.add('d-none');
    if (backendStatus) {
      backendStatus.classList.add('d-none');
    }

    const usuario = document.getElementById('username').value.trim();
    const contrasena = document.getElementById('password').value.trim();
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
  logoutButton.addEventListener('click', () => {
    clearSessionStorage();
    appSection.classList.remove('active');
    loginSection.classList.add('active');
    form.reset();
    loginError.classList.add('d-none');
    navItems.forEach((item) => item.classList.remove('active'));
  });

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
}

async function restoreSession() {
  const token = localStorage.getItem('jwtToken');
  const role = localStorage.getItem('userRole');
  const nombre = localStorage.getItem('userName');

  if (!token || !role || !nombre) {
    return;
  }

  const user = {
    rol: role,
    nombre,
    id_usuario: Number(localStorage.getItem('userId')) || undefined,
    id_medico: Number(localStorage.getItem('userMedicoId')) || undefined,
  };

  await handleSuccessfulLogin(user, true);
}

function setSessionStorage(user, token) {
  const normalizedUser = normalizeUser(user);
  localStorage.setItem('jwtToken', token);
  localStorage.setItem('userRole', normalizedUser.rol);
  localStorage.setItem('userName', normalizedUser.nombre);

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
}

async function handleSuccessfulLogin(user, isRestoring = false) {
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');

  if (userName && userRole) {
    userName.textContent = user.nombre;
    userRole.textContent = user.rol;
  }

  if (isMedicoRole(user.rol)) {
    await mountMedicoModule(user);
  } else if (isAdministrativeStaffRole(user.rol)) {
    await mountAdminModule(user);
    await mountPacientesModule();
  } else if (isSystemAdministratorRole(user.rol)) {
    await mountAdministradorModule();
  }

  updateDashboardForRole(user.rol, user.nombre);
  updateNavByRole(user.rol);

  if (!isRestoring) {
    loginSection.classList.remove('active');
    appSection.classList.add('active');
  } else {
    loginSection.classList.remove('active');
    appSection.classList.add('active');
  }

  navigateTo(getInitialSectionForRole(user.rol));
}

function getInitialSectionForRole(role) {
  return 'dashboard';
}

function navigateTo(sectionId) {
  const sections = Array.from(document.querySelectorAll('.content-section')).filter((section) => section.id !== 'app-section' && section.id !== 'login-section');
  sections.forEach((section) => {
    if (section.id === `${sectionId}-section`) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });

  const navItems = Array.from(document.querySelectorAll('.sidebar-item'));
  navItems.forEach((item) => {
    if (item.getAttribute('data-section') === sectionId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
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

function updateAdministradorDashboardCounts() {
  const activeUsersCount = document.getElementById('administrador-active-users-count');
  const inactiveUsersCount = document.getElementById('administrador-inactive-users-count');
  const users = getLocalUsers();

  const activeCount = users.filter((user) => user.status === 'Activo').length;
  const inactiveCount = users.filter((user) => user.status === 'Inactivo').length;

  if (activeUsersCount) activeUsersCount.textContent = String(activeCount);
  if (inactiveUsersCount) inactiveUsersCount.textContent = String(inactiveCount);
}

function updateNavByRole(role) {
  const administrativoSections = ['dashboard', 'patients', 'appointments', 'services'];
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
