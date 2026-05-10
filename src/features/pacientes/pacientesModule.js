import { searchPacientes, createPaciente, updatePaciente, getPaciente } from './pacientesService.js';

let patientForm;
let patientSearchInput;
let patientSearchBtn;
let patientResultsTable;
let patientEditModal;
let patientEditForm;
let currentEditingPatientId = null;

export async function mountPacientesModule() {
  await registerPatientManagement();
}

async function registerPatientManagement() {
  // Form elements
  patientForm = document.getElementById('patient-form');
  patientSearchInput = document.getElementById('patient-search-input');
  patientSearchBtn = document.getElementById('patient-search-btn');
  patientResultsTable = document.getElementById('patient-results-table');
  patientEditModal = new bootstrap.Modal(document.getElementById('patient-edit-modal'));
  patientEditForm = document.getElementById('patient-edit-form');

  // Event listeners
  if (patientForm) {
    patientForm.addEventListener('submit', handleCreatePatient);
  }

  if (patientSearchBtn) {
    patientSearchBtn.addEventListener('click', handleSearchPatients);
  }

  if (patientEditForm) {
    patientEditForm.addEventListener('submit', handleUpdatePatient);
  }

  // Initialize
  renderPatientResults([]);
}

async function handleCreatePatient(event) {
  event.preventDefault();

  const formData = new FormData(patientForm);
  const patientData = {
    num_identificacion: formData.get('num_identificacion'),
    fecha_nacimiento: formData.get('fecha_nacimiento'),
    nombre: formData.get('nombre'),
    primer_apellido: formData.get('primer_apellido'),
    segundo_apellido: formData.get('segundo_apellido'),
    direccion: formData.get('direccion'),
    eps: formData.get('eps'),
    regimen: formData.get('regimen'),
    contactos: [] // TODO: Implement contact management
  };

  try {
    const newPatient = await createPaciente(patientData);
    showMessage('Paciente creado exitosamente', 'success');
    patientForm.reset();
  } catch (error) {
    if (error.message.includes('409')) {
      showMessage('El número de identificación ya existe', 'error');
    } else {
      showMessage('Error al crear paciente: ' + error.message, 'error');
    }
  }
}

async function handleSearchPatients() {
  const query = patientSearchInput.value.trim();
  if (!query) {
    showMessage('Ingrese un término de búsqueda', 'warning');
    return;
  }

  try {
    const results = await searchPacientes(query);
    renderPatientResults(results);
  } catch (error) {
    showMessage('Error en la búsqueda: ' + error.message, 'error');
    renderPatientResults([]);
  }
}

async function handleUpdatePatient(event) {
  event.preventDefault();

  if (!currentEditingPatientId) return;

  const formData = new FormData(patientEditForm);
  const patientData = {
    fecha_nacimiento: formData.get('fecha_nacimiento'),
    nombre: formData.get('nombre'),
    primer_apellido: formData.get('primer_apellido'),
    segundo_apellido: formData.get('segundo_apellido'),
    direccion: formData.get('direccion'),
    eps: formData.get('eps'),
    regimen: formData.get('regimen'),
    contactos: [] // TODO: Implement contact management
  };

  try {
    const updatedPatient = await updatePaciente(currentEditingPatientId, patientData);
    showMessage('Paciente actualizado exitosamente', 'success');
    patientEditModal.hide();
    // Refresh search results if any
    if (patientSearchInput.value.trim()) {
      handleSearchPatients();
    }
  } catch (error) {
    showMessage('Error al actualizar paciente: ' + error.message, 'error');
  }
}

function renderPatientResults(patients) {
  if (!patientResultsTable) return;

  if (patients.length === 0) {
    patientResultsTable.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No se encontraron pacientes</td>
      </tr>
    `;
    return;
  }

  patientResultsTable.innerHTML = patients.map(patient => `
    <tr>
      <td>${patient.num_identificacion}</td>
      <td>${patient.nombre}</td>
      <td>${patient.primer_apellido} ${patient.segundo_apellido || ''}</td>
      <td>${patient.eps || 'N/A'}</td>
      <td>${patient.regimen || 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-primary edit-patient-btn" data-id="${patient.id_paciente}">
          <i class="fas fa-edit"></i> Editar
        </button>
      </td>
    </tr>
  `).join('');

  // Add event listeners to edit buttons
  document.querySelectorAll('.edit-patient-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const patientId = e.target.closest('button').dataset.id;
      openEditModal(patientId);
    });
  });
}

async function openEditModal(patientId) {
  try {
    const patient = await getPaciente(patientId);
    currentEditingPatientId = patientId;

    // Populate form
    document.getElementById('edit-num-identificacion').value = patient.num_identificacion;
    document.getElementById('edit-num-identificacion').disabled = true; // Cannot edit ID
    document.getElementById('edit-fecha-nacimiento').value = patient.fecha_nacimiento;
    document.getElementById('edit-nombre').value = patient.nombre;
    document.getElementById('edit-primer-apellido').value = patient.primer_apellido;
    document.getElementById('edit-segundo-apellido').value = patient.segundo_apellido;
    document.getElementById('edit-direccion').value = patient.direccion;
    document.getElementById('edit-eps').value = patient.eps;
    document.getElementById('edit-regimen').value = patient.regimen;

    patientEditModal.show();
  } catch (error) {
    showMessage('Error al cargar paciente: ' + error.message, 'error');
  }
}

function showMessage(message, type) {
  // Simple alert for now, can be improved with toast notifications
  const alertType = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-warning';
  const alertHtml = `<div class="alert ${alertType} alert-dismissible fade show" role="alert">
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>`;

  // Insert at top of patients section
  const patientsSection = document.getElementById('patients-section');
  patientsSection.insertAdjacentHTML('afterbegin', alertHtml);

  // Auto remove after 5 seconds
  setTimeout(() => {
    const alert = patientsSection.querySelector('.alert');
    if (alert) alert.remove();
  }, 5000);
}