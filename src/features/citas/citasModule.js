import { getCitasFiltradas, getCita, updateCita, cancelarCita, registrarHistorialCita, getMedicos, getEspecialidades, getEstados } from './citasService.js';

let agendaTable;
let agendaAlerta;
let filtroEstadoSelect;
let filtroEspecialidadSelect;
let filtroMedicoSelect;
let filtroFechaInicioInput;
let filtroFechaFinInput;
let filtroPacienteInput;
let aplicarFiltrosBtn;
let limpiarFiltrosBtn;
let alertTimeoutId = null;

const api = {
  getCitasFiltradas: async (filtros) => {
    const response = await getCitasFiltradas(filtros);
    return response?.data || response || [];
  },
  getCita: async (id) => {
    const response = await getCita(id);
    return response?.data || response || null;
  },
  actualizarCita: async (id, data) => {
    const response = await updateCita(id, data);
    return response?.data || response;
  },
  cancelarCita: async (id, motivo) => {
    const response = await cancelarCita(id, motivo);
    return response?.data || response;
  },
  registrarHistorial: async (id, datos) => {
    const response = await registrarHistorialCita(id, datos);
    return response?.data || response;
  },
  getMedicos: async () => {
    const response = await getMedicos();
    return response?.data || response || [];
  },
  getEspecialidades: async () => {
    const response = await getEspecialidades();
    return response?.data || response || [];
  },
  getEstados: async () => {
    const response = await getEstados();
    return response?.data || response || [];
  }
};

export async function mountAgendaModule() {
  await initModuloAgenda();
}

export async function initModuloAgenda() {
  await registerAgendaManagement();
}

async function registerAgendaManagement() {
  // Initialize DOM references
  agendaTable = document.getElementById('agenda-table');
  agendaAlerta = document.getElementById('agenda-alerta');
  filtroEstadoSelect = document.getElementById('filtro-estado');
  filtroEspecialidadSelect = document.getElementById('filtro-especialidad');
  filtroMedicoSelect = document.getElementById('filtro-medico');
  filtroFechaInicioInput = document.getElementById('filtro-fecha-inicio');
  filtroFechaFinInput = document.getElementById('filtro-fecha-fin');
  filtroPacienteInput = document.getElementById('filtro-paciente');
  aplicarFiltrosBtn = document.getElementById('aplicar-filtros-btn');
  limpiarFiltrosBtn = document.getElementById('limpiar-filtros-btn');

  // Event listeners for filters
  aplicarFiltrosBtn?.addEventListener('click', handleAplicarFiltros);
  limpiarFiltrosBtn?.addEventListener('click', handleLimpiarFiltros);

  // Global functions for table actions
  window.modificarCita = modificarCita;
  window.cancelarCitaModal = cancelarCitaModal;
  window.registrarCitaCompletada = registrarCitaCompletada;

  // Populate filter dropdowns
  await populateFilterOptions();

  // Load initial appointments
  await cargarAgenda();
}

async function populateFilterOptions() {
  // Load especialidades
  if (filtroEspecialidadSelect) {
    try {
      const especialidades = await api.getEspecialidades();
      if (Array.isArray(especialidades) && especialidades.length > 0) {
        filtroEspecialidadSelect.innerHTML = `<option value="">Todas las especialidades</option>` +
          especialidades.map((item) => `<option value="${item.id_especialidad}">${item.nombre}</option>`).join('');
      }
    } catch (error) {
      console.warn('Error loading especialidades:', error.message);
    }
  }

  // Load médicos
  if (filtroMedicoSelect) {
    try {
      const medicos = await api.getMedicos();
      if (Array.isArray(medicos) && medicos.length > 0) {
        filtroMedicoSelect.innerHTML = `<option value="">Todos los médicos</option>` +
          medicos.map((item) => `<option value="${item.id_medico}">${item.nombre} ${item.apellido}</option>`).join('');
      }
    } catch (error) {
      console.warn('Error loading médicos:', error.message);
    }
  }

  // Load estados
  if (filtroEstadoSelect) {
    try {
      const estados = await api.getEstados();
      if (Array.isArray(estados) && estados.length > 0) {
        filtroEstadoSelect.innerHTML = `<option value="">Todos los estados</option>` +
          estados.map((estado) => `<option value="${estado}">${capitalizarPrimera(estado)}</option>`).join('');
      }
    } catch (error) {
      console.warn('Error loading estados:', error.message);
    }
  }
}

async function handleAplicarFiltros() {
  const filtros = {
    estado: filtroEstadoSelect?.value || '',
    especialidad: filtroEspecialidadSelect?.value || '',
    medico: filtroMedicoSelect?.value || '',
    fecha_inicio: filtroFechaInicioInput?.value || '',
    fecha_fin: filtroFechaFinInput?.value || '',
    paciente_nombre: filtroPacienteInput?.value.trim() || ''
  };

  try {
    await cargarAgenda(filtros);
  } catch (error) {
    mostrarAlerta('danger', 'Error al aplicar filtros: ' + error.message);
  }
}

function handleLimpiarFiltros() {
  if (filtroEstadoSelect) filtroEstadoSelect.value = '';
  if (filtroEspecialidadSelect) filtroEspecialidadSelect.value = '';
  if (filtroMedicoSelect) filtroMedicoSelect.value = '';
  if (filtroFechaInicioInput) filtroFechaInicioInput.value = '';
  if (filtroFechaFinInput) filtroFechaFinInput.value = '';
  if (filtroPacienteInput) filtroPacienteInput.value = '';

  cargarAgenda();
}

async function cargarAgenda(filtros = {}) {
  try {
    const citas = await api.getCitasFiltradas(filtros);
    renderAgendaTable(citas);
  } catch (error) {
    mostrarAlerta('danger', 'Error al cargar agenda: ' + error.message);
    renderAgendaTable([]);
  }
}

function renderAgendaTable(citas) {
  if (!agendaTable) return;

  if (!citas || citas.length === 0) {
    agendaTable.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted">No se encontraron citas</td>
      </tr>
    `;
    return;
  }

  agendaTable.innerHTML = citas
    .map((cita) => `
      <tr>
        <td>${cita.fecha_cita}</td>
        <td>${cita.hora_cita}</td>
        <td>${cita.paciente_nombre} ${cita.paciente_apellido}</td>
        <td>${cita.medico_nombre} ${cita.medico_apellido}</td>
        <td>${cita.especialidad}</td>
        <td>
          <span class="badge bg-${getEstadoBadgeColor(cita.estado)}">
            ${capitalizarPrimera(cita.estado)}
          </span>
        </td>
        <td>${cita.observaciones || '-'}</td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            ${cita.estado !== 'cancelada' ? `
              <button type="button" class="btn btn-outline-warning" onclick="modificarCita(${cita.id_cita})" title="Modificar">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="btn btn-outline-danger" onclick="cancelarCitaModal(${cita.id_cita})" title="Cancelar">
                <i class="fas fa-times"></i>
              </button>
            ` : ''}
            ${cita.estado === 'confirmada' ? `
              <button type="button" class="btn btn-outline-success" onclick="registrarCitaCompletada(${cita.id_cita})" title="Marcar completada">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
            <button type="button" class="btn btn-outline-info" onclick="verDetallesCita(${cita.id_cita})" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `)
    .join('');
}

function getEstadoBadgeColor(estado) {
  const colors = {
    confirmada: 'success',
    pendiente: 'warning',
    cancelada: 'danger',
    completada: 'info'
  };
  return colors[estado] || 'secondary';
}

async function modificarCita(citaId) {
  try {
    const cita = await api.getCita(citaId);
    if (!cita) {
      mostrarAlerta('warning', 'No se encontró la cita para modificar.');
      return;
    }

    // Open modal to modify appointment
    abrirModalModificarCita(cita);
  } catch (error) {
    mostrarAlerta('danger', 'Error al cargar cita: ' + error.message);
  }
}

function abrirModalModificarCita(cita) {
  // Create and show modal for modifying appointment
  const modal = document.getElementById('modal-modificar-cita');
  if (!modal) {
    mostrarAlerta('warning', 'Modal de modificación no disponible.');
    return;
  }

  // Populate modal with cita data
  const modalContent = modal.querySelector('.modal-body');
  if (modalContent) {
    modalContent.innerHTML = `
      <div class="mb-3">
        <label class="form-label">Paciente</label>
        <input type="text" class="form-control" value="${cita.paciente_nombre} ${cita.paciente_apellido}" disabled>
      </div>
      <div class="mb-3">
        <label class="form-label">Médico</label>
        <input type="text" class="form-control" value="${cita.medico_nombre} ${cita.medico_apellido}" disabled>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Fecha</label>
          <input type="date" class="form-control" id="mod-fecha" value="${cita.fecha_cita}">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Hora</label>
          <input type="time" class="form-control" id="mod-hora" value="${cita.hora_cita}">
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Observaciones</label>
        <textarea class="form-control" id="mod-observaciones" rows="3">${cita.observaciones || ''}</textarea>
      </div>
    `;
  }

  // Update modal title
  const modalTitle = modal.querySelector('.modal-title');
  if (modalTitle) {
    modalTitle.textContent = 'Modificar Cita';
  }

  // Update modal button to save changes
  const modalButton = modal.querySelector('.modal-footer .btn-primary');
  if (modalButton) {
    modalButton.textContent = 'Guardar Cambios';
    modalButton.onclick = async () => {
      await guardarCambiosCita(cita.id_cita);
    };
  }

  // Show modal
  const bsModal = new (window.bootstrap?.Modal || function(){})( modal);
  if (bsModal.show) bsModal.show();
}

async function guardarCambiosCita(citaId) {
  try {
    const nuevaFecha = document.getElementById('mod-fecha')?.value;
    const nuevaHora = document.getElementById('mod-hora')?.value;
    const nuevasObservaciones = document.getElementById('mod-observaciones')?.value;

    if (!nuevaFecha || !nuevaHora) {
      mostrarAlerta('warning', 'Por favor complete la fecha y hora.');
      return;
    }

    const dataActualizar = {
      fecha_cita: nuevaFecha,
      hora_cita: nuevaHora,
      observaciones: nuevasObservaciones
    };

    await api.actualizarCita(citaId, dataActualizar);
    mostrarAlerta('success', 'Cita modificada exitosamente.');

    // Close modal and reload agenda
    const modal = document.getElementById('modal-modificar-cita');
    const bsModal = new (window.bootstrap?.Modal || function(){})( modal);
    if (bsModal.hide) bsModal.hide();

    await cargarAgenda();
  } catch (error) {
    mostrarAlerta('danger', 'Error al guardar cambios: ' + error.message);
  }
}

async function cancelarCitaModal(citaId) {
  // Open modal to confirm cancellation
  const motivo = prompt('¿Cuál es el motivo de la cancelación?', '');
  if (!motivo || motivo.trim() === '') {
    return;
  }

  try {
    await api.cancelarCita(citaId, motivo.trim());
    mostrarAlerta('success', 'Cita cancelada exitosamente.');
    await cargarAgenda();
  } catch (error) {
    mostrarAlerta('danger', 'Error al cancelar cita: ' + error.message);
  }
}

async function registrarCitaCompletada(citaId) {
  try {
    const nota = prompt('Ingrese nota o observación de la consulta:', '');

    const datosHistorial = {
      estado: 'completada',
      nota_clinica: nota || ''
    };

    await api.registrarHistorial(citaId, datosHistorial);
    mostrarAlerta('success', 'Cita marcada como completada.');
    await cargarAgenda();
  } catch (error) {
    mostrarAlerta('danger', 'Error al completar cita: ' + error.message);
  }
}

function verDetallesCita(citaId) {
  // Show appointment details in an alert or modal
  api.getCita(citaId).then(cita => {
    if (cita) {
      mostrarAlerta('info', `
        <strong>${cita.paciente_nombre} ${cita.paciente_apellido}</strong><br>
        <strong>Médico:</strong> ${cita.medico_nombre} ${cita.medico_apellido}<br>
        <strong>Especialidad:</strong> ${cita.especialidad}<br>
        <strong>Fecha:</strong> ${cita.fecha_cita}<br>
        <strong>Hora:</strong> ${cita.hora_cita}<br>
        <strong>Estado:</strong> ${capitalizarPrimera(cita.estado)}<br>
        <strong>Observaciones:</strong> ${cita.observaciones || 'Sin observaciones'}
      `);
    }
  }).catch(error => {
    mostrarAlerta('danger', 'Error al cargar detalles: ' + error.message);
  });
}

function mostrarAlerta(tipo, mensaje) {
  if (!agendaAlerta) return;

  clearTimeout(alertTimeoutId);
  agendaAlerta.className = `alert alert-${tipo} alert-dismissible fade show mb-3`;
  agendaAlerta.setAttribute('role', 'alert');
  agendaAlerta.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" aria-label="Close"></button>
  `;

  agendaAlerta.querySelector('.btn-close')?.addEventListener('click', () => {
    agendaAlerta.classList.add('d-none');
  });

  agendaAlerta.classList.remove('d-none');
  alertTimeoutId = setTimeout(() => {
    agendaAlerta.classList.add('d-none');
  }, 4000);
}

function capitalizarPrimera(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
