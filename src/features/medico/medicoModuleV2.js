import {
  getCitasHoy,
  getTodasCitasMedico,
  registrarConsultaConServicios,
  getServicios,
} from './medicoService.js';

let medicoActual = null;
let serviciosDisponibles = [];
let todasCitas = [];
let citasHoy = [];

// DOM Elements
let citasTable;
let citasSearch;
let citasSearchBtn;
let citasTableBody;
let citasFilterSelect;
let registroConsultaModal;
let registroConsultaForm;
let currentCitaForConsulta = null;

export async function mountMedicoModule(user) {
  medicoActual = user.id_medico || user.id_medico_fk || user.id_usuario;
  console.log('📋 Módulo Médico cargado. ID Médico:', medicoActual);

  // Cargar datos
  serviciosDisponibles = await getServicios();
  console.log('🏥 Servicios cargados:', serviciosDisponibles.length);

  citasHoy = await getCitasHoy(medicoActual);
  todasCitas = await getTodasCitasMedico(medicoActual);
  
  console.log('📅 Citas de hoy:', citasHoy.length);
  console.log('📅 Todas las citas:', todasCitas.length);

  // Inicializar UI
  initializeUI();
  renderDashboardStats();
}

function initializeUI() {
  // Get elements
  citasSearch = document.getElementById('medico-citas-search');
  citasSearchBtn = document.getElementById('medico-citas-search-btn');
  citasTableBody = document.getElementById('medico-citas-table-body');
  citasFilterSelect = document.getElementById('medico-citas-filter');
  registroConsultaModal = new bootstrap.Modal(document.getElementById('registro-consulta-modal') || createRegistroConsultaModal());
  registroConsultaForm = document.getElementById('registro-consulta-form');

  // Event listeners
  if (citasSearchBtn) {
    citasSearchBtn.addEventListener('click', handleSearchCitas);
  }

  if (citasSearch) {
    citasSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearchCitas();
      }
    });
  }

  if (citasFilterSelect) {
    citasFilterSelect.addEventListener('change', handleFilterCitas);
  }

  if (registroConsultaForm) {
    registroConsultaForm.addEventListener('submit', handleRegistrarConsulta);
  }

  // Render initial table
  renderCitasTable(citasHoy);
}

function renderDashboardStats() {
  const hoy = new Date().toISOString().split('T')[0];
  const citasHoyCount = todasCitas.filter(c => c.fecha === hoy).length;
  const citasPendientes = todasCitas.filter(c => c.estado === 'Agendada' || c.estado === 'Pendiente').length;
  const citasAtendidas = todasCitas.filter(c => c.estado === 'Atendida' || c.estado === 'Completada').length;

  const citasHoyEl = document.getElementById('medico-citas-hoy-count');
  const citasPendientesEl = document.getElementById('medico-citas-pendientes-count');
  const citasAtendidasEl = document.getElementById('medico-citas-atendidas-count');

  if (citasHoyEl) citasHoyEl.textContent = citasHoyCount;
  if (citasPendientesEl) citasPendientesEl.textContent = citasPendientes;
  if (citasAtendidasEl) citasAtendidasEl.textContent = citasAtendidas;
}

function renderCitasTable(citas) {
  if (!citasTableBody) return;

  if (!citas || citas.length === 0) {
    citasTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          <i class="fas fa-inbox"></i> No hay citas para mostrar
        </td>
      </tr>
    `;
    return;
  }

  citasTableBody.innerHTML = citas
    .map((cita) => `
      <tr>
        <td>${cita.fecha}</td>
        <td>${cita.hora}</td>
        <td>Paciente ${cita.id_paciente_fk}</td>
        <td><span class="badge bg-${getEstadoBadgeColor(cita.estado)}">${cita.estado}</span></td>
        <td>${cita.observacion || '—'}</td>
        <td>
          <button class="btn btn-sm btn-primary abrirConsultaBtn" data-cita-id="${cita.id_cita}">
            <i class="fas fa-stethoscope"></i> Registrar Consulta
          </button>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-secondary verDetallesBtn" data-cita-id="${cita.id_cita}">
            <i class="fas fa-eye"></i> Detalles
          </button>
        </td>
      </tr>
    `)
    .join('');

  // Attach event listeners
  citasTableBody.querySelectorAll('.abrirConsultaBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const citaId = parseInt(e.currentTarget.dataset.citaId);
      const cita = todasCitas.find(c => c.id_cita === citaId);
      if (cita) {
        currentCitaForConsulta = cita;
        abrirRegistroConsultaModal(cita);
      }
    });
  });

  citasTableBody.querySelectorAll('.verDetallesBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const citaId = parseInt(e.currentTarget.dataset.citaId);
      const cita = todasCitas.find(c => c.id_cita === citaId);
      if (cita) {
        mostrarDetallesCita(cita);
      }
    });
  });
}

async function handleSearchCitas() {
  const query = citasSearch?.value.trim().toLowerCase();
  if (!query) {
    renderCitasTable(citasHoy);
    return;
  }

  const filtered = todasCitas.filter(cita =>
    cita.fecha.includes(query) ||
    cita.hora.includes(query) ||
    cita.observacion?.toLowerCase().includes(query) ||
    cita.estado.toLowerCase().includes(query)
  );

  renderCitasTable(filtered);
}

function handleFilterCitas() {
  const filterValue = citasFilterSelect?.value || 'hoy';
  const hoy = new Date().toISOString().split('T')[0];

  let filtered = [];
  if (filterValue === 'hoy') {
    filtered = todasCitas.filter(c => c.fecha === hoy);
  } else if (filterValue === 'pendientes') {
    filtered = todasCitas.filter(c => c.estado === 'Agendada' || c.estado === 'Pendiente');
  } else if (filterValue === 'atendidas') {
    filtered = todasCitas.filter(c => c.estado === 'Atendida' || c.estado === 'Completada');
  } else if (filterValue === 'todas') {
    filtered = todasCitas;
  }

  renderCitasTable(filtered);
}

function abrirRegistroConsultaModal(cita) {
  // Populate modal with cita data
  const diagnosticoInput = document.getElementById('registro-diagnostico');
  const observacionInput = document.getElementById('registro-observacion');
  const serviciosContainer = document.getElementById('registro-servicios-container');
  const citaHiddenInput = document.getElementById('registro-cita-id');

  if (citaHiddenInput) citaHiddenInput.value = cita.id_cita;

  if (diagnosticoInput) diagnosticoInput.value = '';
  if (observacionInput) observacionInput.value = '';

  // Populate services checkboxes
  if (serviciosContainer) {
    serviciosContainer.innerHTML = serviciosDisponibles
      .map(
        (servicio) => `
        <div class="form-check">
          <input class="form-check-input servicio-check" type="checkbox" id="servicio-${servicio.id_servicio}" value="${servicio.id_servicio}">
          <label class="form-check-label" for="servicio-${servicio.id_servicio}">
            ${servicio.nombre}
          </label>
        </div>
      `
      )
      .join('');
  }

  registroConsultaModal.show();
}

async function handleRegistrarConsulta(event) {
  event.preventDefault();

  if (!currentCitaForConsulta) {
    alert('Error: No hay cita seleccionada');
    return;
  }

  const diagnostico = document.getElementById('registro-diagnostico')?.value.trim();
  const observacion = document.getElementById('registro-observacion')?.value.trim();
  const serviciosSeleccionados = Array.from(document.querySelectorAll('.servicio-check:checked')).map(
    (ch) => parseInt(ch.value)
  );

  if (!diagnostico) {
    alert('El diagnóstico es requerido');
    return;
  }

  if (serviciosSeleccionados.length === 0) {
    alert('Debe seleccionar al menos un servicio');
    return;
  }

  try {
    await registrarConsultaConServicios({
      id_cita_fk: currentCitaForConsulta.id_cita,
      diagnostico,
      observacion,
      servicios_ids: serviciosSeleccionados,
    });

    alert('✅ Consulta registrada exitosamente');
    registroConsultaModal.hide();
    registroConsultaForm?.reset();

    // Refresh citas
    citasHoy = await getCitasHoy(medicoActual);
    todasCitas = await getTodasCitasMedico(medicoActual);
    renderDashboardStats();
    handleFilterCitas();
  } catch (error) {
    console.error('Error registrando consulta:', error);
    alert('❌ Error al registrar la consulta: ' + error.message);
  }
}

function mostrarDetallesCita(cita) {
  alert(
    `Detalles de la cita:\n\n` +
    `Fecha: ${cita.fecha}\n` +
    `Hora: ${cita.hora}\n` +
    `Estado: ${cita.estado}\n` +
    `Observación: ${cita.observacion || 'Sin observaciones'}\n` +
    `Paciente ID: ${cita.id_paciente_fk}`
  );
}

function getEstadoBadgeColor(estado) {
  const estadoLower = estado?.toLowerCase() || '';
  if (estadoLower.includes('agendada') || estadoLower.includes('pendiente')) return 'warning';
  if (estadoLower.includes('atendida') || estadoLower.includes('completada')) return 'success';
  if (estadoLower.includes('cancelada') || estadoLower.includes('rechazada')) return 'danger';
  return 'secondary';
}

function createRegistroConsultaModal() {
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal fade';
  modalDiv.id = 'registro-consulta-modal';
  modalDiv.tabIndex = '-1';
  modalDiv.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Registrar Consulta</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="registro-consulta-form">
            <input type="hidden" id="registro-cita-id" value="">
            
            <div class="mb-3">
              <label for="registro-diagnostico" class="form-label">Diagnóstico *</label>
              <textarea class="form-control" id="registro-diagnostico" rows="4" required></textarea>
            </div>

            <div class="mb-3">
              <label for="registro-observacion" class="form-label">Observaciones</label>
              <textarea class="form-control" id="registro-observacion" rows="2"></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label">Servicios Prestados *</label>
              <div id="registro-servicios-container"></div>
            </div>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary">Guardar Consulta</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalDiv);
  return modalDiv;
}
