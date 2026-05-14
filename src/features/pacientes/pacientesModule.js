import { searchPacientes, createPaciente, updatePaciente, getPaciente, getEps, getRegimenes } from './pacientesService.js';

let patientForm;
let patientFormHeader;
let pacienteIdInput;
let birthDateInput;
let firstNameInput;
let lastNameInput;
let secondLastNameInput;
let addressInput;
let sexoSelect;
let tipoSangreSelect;
let epsSelect;
let regimenSelect;
let contactList;
let addContactBtn;
let saveButton;
let cancelEditButton;
let patientSearchInput;
let patientSearchBtn;
let patientResultsTable;
let alertContainer;
let modoEdicion = false;
let pacienteEditandoId = null;
let alertTimeoutId = null;

const CONTACT_TYPES = ['celular', 'fijo', 'email', 'whatsapp'];

const api = {
  getPacientes: async (query) => {
    const response = await searchPacientes(query);
    return response || [];
  },
  getPaciente: async (id) => {
    const response = await getPaciente(id);
    return response || null;
  },
  crearPaciente: async (data) => {
    const response = await createPaciente(data);
    return response;
  },
  actualizarPaciente: async (id, data) => {
    const response = await updatePaciente(id, data);
    return response;
  },
  getEps: async () => {
    const response = await getEps();
    return response || [];
  },
  getRegimenes: async () => {
    const response = await getRegimenes();
    return response || [];
  },
};

export async function mountPacientesModule() {
  await initModuloPacientes();
}

export async function initModuloPacientes() {
  await registerPatientManagement();
}

async function registerPatientManagement() {
  patientFormHeader = document.getElementById('patient-form-header');
  patientForm = document.getElementById('patient-form');
  pacienteIdInput = document.getElementById('patient-num-id');
  birthDateInput = document.getElementById('patient-birth-date');
  firstNameInput = document.getElementById('patient-first-name');
  lastNameInput = document.getElementById('patient-last-name');
  secondLastNameInput = document.getElementById('patient-second-last-name');
  addressInput = document.getElementById('patient-address');
  sexoSelect = document.getElementById('pac-sexo');
  tipoSangreSelect = document.getElementById('pac-tipo-sangre');
  epsSelect = document.getElementById('patient-eps');
  regimenSelect = document.getElementById('patient-regimen');
  contactList = document.getElementById('patient-contact-list');
  addContactBtn = document.getElementById('patient-contact-add-btn');
  saveButton = document.getElementById('patient-save-btn');
  cancelEditButton = document.getElementById('patient-cancel-edit-btn');
  patientSearchInput = document.getElementById('patient-search-input');
  patientSearchBtn = document.getElementById('patient-search-btn');
  patientResultsTable = document.getElementById('patient-results-table');
  alertContainer = document.getElementById('pac-alerta');

  patientForm?.addEventListener('submit', handlePatientFormSubmit);
  addContactBtn?.addEventListener('click', addContactRow);
  cancelEditButton?.addEventListener('click', resetPatientForm);
  patientSearchBtn?.addEventListener('click', handleSearchPatients);
  patientSearchInput?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchPatients();
    }
  });

  window.editarPaciente = editarPaciente;
  window.verHistoria = verHistoria;

  await populateEpsRegimenOptions();
  resetPatientForm();
  renderPatientResults([]);
}

function validateRequiredFields() {
  const requiredInputs = [
    pacienteIdInput,
    birthDateInput,
    firstNameInput,
    lastNameInput,
    epsSelect,
    regimenSelect,
  ];

  if (requiredInputs.some((input) => !input || !input.value || String(input.value).trim() === '')) {
    mostrarAlerta('warning', 'Los campos marcados con * son obligatorios.');
    return false;
  }

  return true;
}

function collectContactos() {
  if (!contactList) return [];

  return Array.from(contactList.querySelectorAll('.contact-row'))
    .map((row) => {
      const tipo = row.querySelector('.contact-type')?.value;
      const dato = row.querySelector('.contact-value')?.value.trim();
      return tipo && dato ? { tipo, dato_contacto: dato } : null;
    })
    .filter(Boolean);
}

function validarContactos(contactos) {
  const tipos = contactos.map((contacto) => contacto.tipo);
  const duplicados = tipos.filter((tipo, index) => tipos.indexOf(tipo) !== index);

  if (duplicados.length > 0) {
    mostrarAlerta('warning', `No puedes agregar dos contactos del tipo "${duplicados[0]}".`);
    return false;
  }

  return true;
}

async function handlePatientFormSubmit(event) {
  event.preventDefault();

  if (!validateRequiredFields()) {
    return;
  }

  const contactos = collectContactos();
  if (!validarContactos(contactos)) {
    return;
  }

  const payload = {
    fecha_nacimiento: birthDateInput.value,
    nombre: firstNameInput.value.trim(),
    primer_apellido: lastNameInput.value.trim(),
    segundo_apellido: secondLastNameInput.value.trim() || null,
    direccion: addressInput.value.trim() || null,
    sexo: sexoSelect.value || null,
    tipo_sangre: tipoSangreSelect.value || null,
    id_eps_fk: epsSelect.value ? Number(epsSelect.value) : null,
    id_regimen_fk: regimenSelect.value ? Number(regimenSelect.value) : null,
    contactos,
  };

  try {
    if (modoEdicion && pacienteEditandoId) {
      await api.actualizarPaciente(pacienteEditandoId, payload);
      mostrarAlerta('success', 'Datos del paciente actualizados correctamente.');
    } else {
      await api.crearPaciente({ numero_identificacion: pacienteIdInput.value.trim(), ...payload });
      mostrarAlerta('success', 'Paciente registrado exitosamente.');
    }

    if (patientSearchInput?.value.trim()) {
      await handleSearchPatients();
    }

    resetPatientForm();
  } catch (error) {
    if (error.message?.includes('409') || error.message?.toLowerCase().includes('ya existe')) {
      mostrarAlerta('danger', `El número de identificación ${pacienteIdInput.value.trim()} ya existe en el sistema.`);
      return;
    }

    mostrarAlerta('danger', `Error al ${modoEdicion ? 'actualizar' : 'registrar'} paciente: ${error.message}`);
  }
}

function renderPatientResults(patients) {
  if (!patientResultsTable) return;

  if (!patients || patients.length === 0) {
    patientResultsTable.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No se encontraron pacientes</td>
      </tr>
    `;
    return;
  }

  patientResultsTable.innerHTML = patients
    .map((patient) => {
      const epsValue = patient.id_eps_fk ?? patient.eps ?? null;
      const regimenValue = patient.id_regimen_fk ?? patient.regimen ?? null;
      return `
      <tr>
        <td>${patient.numero_identificacion ?? patient.num_identificacion ?? '—'}</td>
        <td>${patient.nombre}</td>
        <td>${patient.primer_apellido} ${patient.segundo_apellido || ''}</td>
        <td>${epsValue ?? 'N/A'}</td>
        <td>${regimenValue ?? 'N/A'}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="editarPaciente(${patient.id_paciente})">
            <i class="bi bi-pencil-fill"></i> Editar
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" onclick="verHistoria(${patient.id_paciente})">
            <i class="bi bi-file-medical"></i> Historia
          </button>
        </td>
      </tr>
    `;
    })
    .join('');
}

async function editarPaciente(patientId) {
  try {
    const patient = await api.getPaciente(patientId);
    if (!patient) {
      mostrarAlerta('warning', 'No se encontró el paciente para editar.');
      return;
    }

    modoEdicion = true;
    pacienteEditandoId = patientId;
    patientFormHeader.innerHTML = '<i class="fas fa-user-edit"></i> Editar Paciente';
    saveButton.textContent = 'Actualizar';
    cancelEditButton.classList.remove('d-none');
    pacienteIdInput.disabled = true;

    const epsValue = patient.id_eps_fk ?? patient.eps ?? null;
    const regimenValue = patient.id_regimen_fk ?? patient.regimen ?? null;

    pacienteIdInput.value = patient.numero_identificacion || '';
    birthDateInput.value = patient.fecha_nacimiento || '';
    firstNameInput.value = patient.nombre || '';
    lastNameInput.value = patient.primer_apellido || '';
    secondLastNameInput.value = patient.segundo_apellido || '';
    addressInput.value = patient.direccion || '';
    sexoSelect.value = patient.sexo || '';
    tipoSangreSelect.value = patient.tipo_sangre || '';
    epsSelect.value = epsValue ? String(epsValue) : '';
    regimenSelect.value = regimenValue ? String(regimenValue) : '';

    clearContacts();
    if (Array.isArray(patient.contactos) && patient.contactos.length > 0) {
      patient.contactos.forEach((contacto) => addContactRow(contacto));
    } else {
      addContactRow();
    }

    patientForm.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    mostrarAlerta('danger', 'Error al cargar el paciente: ' + error.message);
  }
}

function verHistoria(patientId) {
  if (window.loadModule) {
    window.loadModule('historia-clinica', { idPaciente: patientId });
    return;
  }

  mostrarAlerta('warning', 'La navegación a la historia clínica no está disponible.');
}

function resetPatientForm() {
  modoEdicion = false;
  pacienteEditandoId = null;
  patientFormHeader.innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Paciente';
  saveButton.textContent = 'Guardar';
  cancelEditButton.classList.add('d-none');
  pacienteIdInput.disabled = false;
  patientForm.reset();
  if (alertContainer) {
    alertContainer.classList.add('d-none');
  }
  clearContacts();
  addContactRow();
}

function clearContacts() {
  if (!contactList) return;
  contactList.innerHTML = '';
}

function addContactRow(contact = null) {
  if (!contactList) return;

  const row = document.createElement('div');
  row.className = 'row mb-2 contact-row';
  row.innerHTML = `
    <div class="col-md-4">
      <select class="form-select contact-type">
        <option value="">Seleccione tipo</option>
        ${CONTACT_TYPES.map((tipo) => `
          <option value="${tipo}" ${contact?.tipo === tipo ? 'selected' : ''}>${tipo}</option>
        `).join('')}
      </select>
    </div>
    <div class="col-md-7">
      <input type="text" class="form-control contact-value" placeholder="Dato de contacto" value="${contact?.dato_contacto || ''}">
    </div>
    <div class="col-md-1">
      <button type="button" class="btn btn-sm btn-danger contact-remove-btn" aria-label="Eliminar contacto">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;

  row.querySelector('.contact-remove-btn')?.addEventListener('click', () => row.remove());
  contactList.appendChild(row);
}

async function handleSearchPatients() {
  const query = patientSearchInput?.value.trim();
  if (!query) {
    mostrarAlerta('warning', 'Ingrese un término de búsqueda.');
    return;
  }

  try {
    const patients = await api.getPacientes(query);
    renderPatientResults(patients);
  } catch (error) {
    mostrarAlerta('danger', 'Error en la búsqueda: ' + error.message);
    renderPatientResults([]);
  }
}

function mostrarAlerta(tipo, mensaje) {
  if (!alertContainer) return;

  clearTimeout(alertTimeoutId);
  alertContainer.className = `alert alert-${tipo} alert-dismissible fade show mb-3`;
  alertContainer.setAttribute('role', 'alert');
  alertContainer.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" aria-label="Close"></button>
  `;

  alertContainer.querySelector('.btn-close')?.addEventListener('click', () => {
    alertContainer.classList.add('d-none');
  });

  alertContainer.classList.remove('d-none');
  alertTimeoutId = setTimeout(() => {
    alertContainer.classList.add('d-none');
  }, 4000);
}

function clearAlert() {
  if (!alertContainer) return;
  clearTimeout(alertTimeoutId);
  alertContainer.classList.add('d-none');
  alertContainer.innerHTML = '';
}

async function populateEpsRegimenOptions() {
  if (epsSelect) {
    try {
      const eps = await api.getEps();
      if (Array.isArray(eps) && eps.length > 0) {
        epsSelect.innerHTML = `<option selected disabled value="">Seleccione EPS</option>` +
          eps.map((item) => `<option value="${item.id_eps}">${item.nombre}</option>`).join('');
      }
    } catch (error) {
      console.warn('No se pudieron cargar EPS:', error.message);
    }
  }

  if (regimenSelect) {
    try {
      const regimenes = await api.getRegimenes();
      if (Array.isArray(regimenes) && regimenes.length > 0) {
        regimenSelect.innerHTML = `<option selected disabled value="">Seleccione Régimen</option>` +
          regimenes.map((item) => `<option value="${item.id_regimen}">${item.nombre}</option>`).join('');
      }
    } catch (error) {
      console.warn('No se pudieron cargar régimenes:', error.message);
    }
  }
}
