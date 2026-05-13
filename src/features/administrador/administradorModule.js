import { fetchUsers, fetchMedicos, getUserById, saveUser, toggleUserStatus } from './administradorService.js';
import { showToast } from '../../utils/toast.js';

let usersTableBody;
let newUserBtn;
let userModalEl;
let saveUserBtn;
let userForm;
let userModalTitle;
let roleSelect;
let statusSelect;
let userNameGroup;
let userNameInput;
let doctorSelect;
let doctorAssociationContainer;
let filterAllBtn;
let filterActiveBtn;
let filterInactiveBtn;
let currentStatusFilter = null;

export async function mountAdministradorModule() {
  console.log('🔄 Iniciando carga de módulo administrador del sistema...');
  try {
    await registerUserAdministration();
    console.log('✅ Módulo administrador del sistema cargado correctamente');
  } catch (error) {
    console.error('❌ Error al cargar módulo administrador:', error);
    throw error;
  }
}

export async function renderUsers(statusFilter = null) {
  if (!usersTableBody) {
    usersTableBody = document.getElementById('users-table-body');
  }
  if (!filterAllBtn) {
    filterAllBtn = document.getElementById('users-filter-all');
    filterActiveBtn = document.getElementById('users-filter-active');
    filterInactiveBtn = document.getElementById('users-filter-inactive');
  }

  currentStatusFilter = statusFilter;
  setFilterButtonState(statusFilter);

  const users = await fetchUsers(statusFilter);
  if (!usersTableBody) return;

  usersTableBody.innerHTML = users
    .map((user) => `
      <tr>
        <td>${user.id_usuario}</td>
        <td>${user.usuario}</td>
        <td>${user.rol}</td>
        <td>${user.status}</td>
        <td>
          <button type="button" class="btn btn-sm btn-warning edit-user-btn" data-id="${user.id_usuario}">Editar</button>
          <button type="button" class="btn btn-sm btn-${user.status === 'Activo' ? 'secondary' : 'success'} toggle-status-btn" data-id="${user.id_usuario}">
            ${user.status === 'Activo' ? 'Desactivar' : 'Activar'}
          </button>
        </td>
      </tr>
    `)
    .join('');
}

async function registerUserAdministration() {
  usersTableBody = document.getElementById('users-table-body');
  newUserBtn = document.getElementById('new-user-btn');
  userModalEl = document.getElementById('userModal');
  saveUserBtn = document.getElementById('save-user-btn');
  userForm = document.getElementById('user-form');
  userModalTitle = document.getElementById('userModalTitle');
  roleSelect = document.getElementById('user-role-select');
  statusSelect = document.getElementById('user-status');
  userNameGroup = document.getElementById('user-name-group');
  userNameInput = document.getElementById('user-name');
  doctorSelect = document.getElementById('user-doctor-id');
  doctorAssociationContainer = document.getElementById('doctor-association-container');

  if (!usersTableBody || !newUserBtn || !userModalEl || !saveUserBtn || !userForm || !userModalTitle || !roleSelect || !statusSelect) return;

  filterAllBtn = document.getElementById('users-filter-all');
  filterActiveBtn = document.getElementById('users-filter-active');
  filterInactiveBtn = document.getElementById('users-filter-inactive');

  await renderUsers();
  await populateDoctorsDropdown();
  toggleFieldsByRole(roleSelect.value);

  newUserBtn.addEventListener('click', () => {
    userForm.reset();
    userForm.querySelector('#user-id').value = '';
    userModalTitle.textContent = 'Nuevo Usuario';
    toggleFieldsByRole(roleSelect.value);
    populateDoctorsDropdown();
    const modal = new bootstrap.Modal(userModalEl);
    modal.show();
  });

  filterAllBtn?.addEventListener('click', async () => {
    await renderUsers(null);
  });
  filterActiveBtn?.addEventListener('click', async () => {
    await renderUsers('Activo');
  });
  filterInactiveBtn?.addEventListener('click', async () => {
    await renderUsers('Inactivo');
  });

  usersTableBody.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.edit-user-btn');
    const toggleBtn = event.target.closest('.toggle-status-btn');
    if (editBtn) {
      const userId = Number(editBtn.dataset.id);
      await openEditUserModal(userId);
    }
    if (toggleBtn) {
      const userId = Number(toggleBtn.dataset.id);
      await handleToggleUserStatus(userId);
    }
  });

  roleSelect.addEventListener('change', () => toggleFieldsByRole(roleSelect.value));

  saveUserBtn.addEventListener('click', async () => {
    await handleSaveUser();
  });
}

async function handleSaveUser() {
  const userId = Number(userForm.querySelector('#user-id').value) || null;
  const username = userForm.querySelector('#user-username').value.trim();
  const password = userForm.querySelector('#user-password').value.trim();
  const role = roleSelect.value;
  const status = statusSelect.value;
  const name = userNameInput?.value.trim();
  const id_medico_fk = role === 'Médico' ? Number(doctorSelect.value) || null : null;

  if (!username || !role) {
    showToast('Usuario y rol son obligatorios.', 'error');
    return;
  }

  if (!userId && !password) {
    showToast('La contraseña es obligatoria al crear un usuario.', 'error');
    return;
  }

  const payload = {
    id_usuario: userId || undefined,
    usuario: username,
    contrasena: password,
    rol: role,
    status,
    nombre: name,
    id_medico_fk,
  };

  try {
    await saveUser(payload);
    await renderUsers(currentStatusFilter);
    const modal = bootstrap.Modal.getInstance(userModalEl);
    if (modal) modal.hide();
  } catch (error) {
    showToast(error.message || 'No se pudo guardar el usuario.', 'error');
  }
}

function toggleFieldsByRole(role) {
  const isMedico = role === 'Médico';
  if (userNameGroup) {
    userNameGroup.style.display = isMedico ? 'none' : '';
    userNameInput.required = !isMedico;
  }
  if (doctorAssociationContainer) {
    doctorAssociationContainer.style.display = isMedico ? '' : 'none';
    doctorSelect.required = isMedico;
  }
}

function setFilterButtonState(statusFilter) {
  [filterAllBtn, filterActiveBtn, filterInactiveBtn].forEach((button) => {
    if (!button) return;
    const isActive = button.id === 'users-filter-all'
      ? statusFilter === null
      : button.id === 'users-filter-active'
        ? statusFilter === 'Activo'
        : statusFilter === 'Inactivo';
    button.classList.toggle('active', isActive);
  });
}

async function populateDoctorsDropdown() {
  if (!doctorSelect) return;
  doctorSelect.innerHTML = '<option value="">Seleccione un médico (opcional)</option>';
  const medicos = await fetchMedicos();
  medicos.forEach((medico) => {
    const option = document.createElement('option');
    option.value = medico.id_medico;
    option.textContent = medico.nombre;
    doctorSelect.appendChild(option);
  });
}

async function openEditUserModal(userId) {
  const user = await getUserById(userId);
  if (!user) return;

  userForm.querySelector('#user-id').value = user.id_usuario;
  userForm.querySelector('#user-username').value = user.usuario;
  userForm.querySelector('#user-password').value = '';
  roleSelect.value = user.rol;
  statusSelect.value = user.status;
  if (userNameInput) userNameInput.value = user.nombre || '';
  await populateDoctorsDropdown();
  if (doctorSelect) doctorSelect.value = user.id_medico_fk || '';
  userModalTitle.textContent = 'Editar Usuario';
  toggleFieldsByRole(user.rol);
  const modal = new bootstrap.Modal(userModalEl);
  modal.show();
}

async function handleToggleUserStatus(userId) {
  await toggleUserStatus(userId);
  await renderUsers(currentStatusFilter);
}
