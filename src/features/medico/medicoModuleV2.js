import {
  getCitasHoy,
  getTodasCitasMedico,
  registrarConsultaConServicios,
  getServicios,
  getHistoriaClinicaByPaciente,
  createHistoriaClinica,
  registrarSignosVitalesPorConsulta,
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

  // Vaciar inputs principales
  if (diagnosticoInput) diagnosticoInput.value = '';
  if (observacionInput) observacionInput.value = '';

  // Reset signos vitales (solo del formulario)
  const signosVitalesContainer = document.getElementById('registro-signos-vitales-container');
  if (signosVitalesContainer) {
    signosVitalesContainer.querySelectorAll('input, select, textarea').forEach((el) => {
      if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else {
        el.value = '';
      }
    });
  }

  // === Cargar historia y completar UI (encabezado, alertas, antecedentes, resumen, previas) ===
  try {
    const pacienteId = cita.id_paciente_fk;
    const datosHistoria = pacienteId ? await getHistoriaClinicaByPaciente(pacienteId) : null;

    // Encabezado paciente
    const nombreEncabezado = document.getElementById('registro-encabezado-nombre');
    const edadEncabezado = document.getElementById('registro-encabezado-edad');
    const documentoEncabezado = document.getElementById('registro-encabezado-documento');
    const sangreEncabezado = document.getElementById('registro-encabezado-sangre');

    // En mock no siempre llega paciente dentro de getHistoriaClinicaByPaciente; lo dejamos como fallback
    if (nombreEncabezado) nombreEncabezado.textContent = `Paciente ${pacienteId ?? '-'}`;
    if (documentoEncabezado) documentoEncabezado.textContent = '—';
    if (edadEncabezado) edadEncabezado.textContent = '—';

    // Tipo de sangre (mock demo)
    if (sangreEncabezado) {
      const tipos = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
      sangreEncabezado.textContent = tipos[Math.floor(Math.random() * tipos.length)];
    }

    // Alertas (mock de ejemplo hasta backend)
    const alergiasContainer = document.getElementById('registro-alergias-container');
    const alergiasDiv = document.getElementById('registro-alergias');
    if (alergiasContainer && alergiasDiv) {
      const alergiasDemo = ['Penicilina', 'Ibuprofeno'];
      const alergias = alergiasDemo;

      if (alergias?.length) {
        alergiasDiv.innerHTML = alergias
          .map(
            (alergia) => `
            <div class="alert alert-warning alert-sm py-2 px-3 mb-0" style="display: inline-block; border-radius: 20px; font-size: 0.85rem;">
              <i class="fas fa-exclamation-triangle"></i> <strong>Alergia:</strong> ${alergia}
            </div>
          `
          )
          .join('');
        alergiasContainer.style.display = 'block';
      } else {
        alergiasContainer.style.display = 'none';
      }
    }

    // Antecedentes (mock/placeholder)
    const antecedentesEl = document.getElementById('registro-antecedentes');
    if (antecedentesEl) {
      antecedentesEl.innerHTML =
        (datosHistoria?.antecedentes && String(datosHistoria.antecedentes).trim())
          ? datosHistoria.antecedentes
          : 'Hipertensión controlada | Diabetes tipo 2 | Sin antecedentes quirúrgicos';
    }

    // Resumen clínico
    const resumenEl = document.getElementById('registro-historia-resumen');
    if (resumenEl) {
      resumenEl.textContent = datosHistoria?.resumen || 'Sin información clínica disponible en el registro.';
    }

    // Historial de consultas previas (si existe el endpoint en mock)
    const consultasPreviasEl = document.getElementById('registro-consultas-previas');
    if (consultasPreviasEl) {
      const historiaId = datosHistoria?.id_historia_clinica || null;
      if (!historiaId) {
        consultasPreviasEl.innerHTML = `
          <div class="text-muted small p-2 text-center">
            Sin consultas previas
          </div>
        `;
      } else {
        // Obtener consultas previas desde mock/contrato (sin importar magicLoop directo)
        const consultasAntesResp = datosHistoria?.consultasAntes;
        const consultasAntes = Array.isArray(consultasAntesResp) ? consultasAntesResp : [];


        if (consultasAntes.length === 0) {
          consultasPreviasEl.innerHTML = `
            <div class="text-muted small p-2 text-center">
              Sin consultas previas
            </div>
          `;
        } else {
          consultasPreviasEl.innerHTML = consultasAntes
            .map(
              (consulta, idx) => `
              <div class="card card-sm mb-2" style="border-left: 4px solid #0dcaf0;">
                <div class="card-body p-2">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <small class="fw-600 text-dark">${consulta.fecha_consulta || consulta.fecha || 'Fecha no disponible'}</small>
                    <span class="badge bg-secondary" style="font-size: 0.7rem;">Consulta ${idx + 1}</span>
                  </div>
                  <div class="small fw-600 text-primary mb-1">Diagnóstico:</div>
                  <div class="small text-dark mb-2">${consulta.diagnostico || 'Sin diagnóstico registrado'}</div>
                  ${consulta.observacion ? `<div class="small text-muted"><strong>Nota:</strong> ${consulta.observacion}</div>` : ''}
                </div>
              </div>
            `
            )
            .join('');
        }
      }
    }
  } catch (e) {
    console.warn('No se pudo cargar historia clínica para UI:', e);
  }

  // Populate services checkboxes (con grid correcto: registro-servicios-grid)
  if (serviciosContainer) {
    const grid = document.getElementById('registro-servicios-grid');
    if (grid) {
      grid.innerHTML = serviciosDisponibles
        .map(
          (servicio) => `
            <div class="col">
              <div class="form-check">
                <input class="form-check-input servicio-check" type="checkbox" id="servicio-${servicio.id_servicio}" value="${servicio.id_servicio}">
                <label class="form-check-label" for="servicio-${servicio.id_servicio}">
                  <i class="fas fa-check-circle text-success" style="opacity: 0.3;"></i> ${servicio.nombre}
                </label>
              </div>
            </div>
          `
        )
        .join('');
    } else {
      // fallback antiguo si cambia el HTML
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
    const payloadConsulta = {
      id_cita_fk: currentCitaForConsulta.id_cita,
      id_historia_clinica_fk: currentCitaForConsulta.id_historia_clinica_fk || null,
      diagnostico,
      observacion,
      servicios_ids: serviciosSeleccionados,
    };

    // === Flujo historia clínica (si no existe, crear) ===
    // Contrato backend: POST historias_clinicas -> {id_historia_clinica}
    if (!payloadConsulta.id_historia_clinica_fk) {
      const pacienteId = currentCitaForConsulta.id_paciente_fk;
      if (!pacienteId) throw new Error('No se encontró id_paciente_fk en la cita');

      let historia = await getHistoriaClinicaByPaciente(pacienteId);
      if (!historia) {
        historia = await createHistoriaClinica({
          id_paciente_fk: pacienteId,
          resumen: 'Historia clínica creada automáticamente desde módulo médico (mock)',
        });
      }

      payloadConsulta.id_historia_clinica_fk = historia?.id_historia_clinica || historia?.id_historia_clinica_fk || null;
    }

    // Guardar consulta
    const consultaGuardada = await registrarConsultaConServicios(payloadConsulta);

    const signos = {
      peso: document.getElementById('signos-peso')?.value
        ? Number(document.getElementById('signos-peso').value)
        : null,

      estatura: document.getElementById('signos-estatura')?.value
        ? Number(document.getElementById('signos-estatura').value)
        : null,

      temperatura: document.getElementById('signos-temperatura')?.value ? Number(document.getElementById('signos-temperatura').value) : null,
      presion_arterial: document.getElementById('signos-presion')?.value?.trim() || null,
      frecuencia_cardiaca: document.getElementById('signos-frecuencia-cardiaca')?.value ? Number(document.getElementById('signos-frecuencia-cardiaca').value) : null,
      saturacion_oxigeno: document.getElementById('signos-saturacion')?.value ? Number(document.getElementById('signos-saturacion').value) : null,
    };

    // Persistir signos vitales (append por consulta)
    // Contrato backend futuro: POST /signos_vitales { id_consulta_fk, ...signos }
    const idConsultaParaSignos = consultaGuardada?.id_consulta || consultaGuardada?.id_consulta_fk || null;
    if (!idConsultaParaSignos) {
      throw new Error('No se pudo obtener id_consulta para asociar signos vitales');
    }

    await registrarSignosVitalesPorConsulta({
      id_consulta_fk: idConsultaParaSignos,
      ...signos,
    });

    console.log('🩺 Signos vitales guardados (mock):', signos);

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
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Registrar Consulta</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="registro-consulta-form">
            <input type="hidden" id="registro-cita-id" value="">

            <div class="mb-4">
              <div class="row gy-3 align-items-center">
                <div class="col-lg-8">
                  <div class="card border-0 shadow-sm bg-primary text-white p-3">
                    <div class="d-flex align-items-center gap-3">
                      <div class="rounded-circle bg-white bg-opacity-25 d-flex justify-content-center align-items-center" style="width:56px;height:56px;">
                        <i class="fas fa-user-md fa-lg"></i>
                      </div>
                      <div>
                        <div id="registro-encabezado-nombre" class="h5 mb-1">Paciente</div>
                        <div class="small" id="registro-encabezado-detalle">Edad • Documento • Tipo de sangre</div>
                      </div>
                    </div>
                    <div id="registro-alergias-container" class="mt-3" style="display:none;">
                      <div id="registro-alergias" class="d-flex flex-wrap gap-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="row gy-4">
              <div class="col-lg-4">
                <div class="card mb-3 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title">Antecedentes</h6>
                    <div id="registro-antecedentes" class="small text-muted">Cargando antecedentes...</div>
                  </div>
                </div>

                <div class="card mb-3 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title">Resumen clínico</h6>
                    <div id="registro-historia-resumen" class="small text-muted">Cargando resumen clínico...</div>
                  </div>
                </div>

                <div class="card shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title">Historial de consultas</h6>
                    <div id="registro-consultas-previas" class="small text-muted">Cargando historial...</div>
                  </div>
                </div>
              </div>

              <div class="col-lg-5">
                <div class="mb-3">
                  <label for="registro-diagnostico" class="form-label">Diagnóstico *</label>
                  <textarea class="form-control" id="registro-diagnostico" rows="5" required></textarea>
                  <small class="text-muted">Sé específico y conciso. Este es el campo principal del registro.</small>
                </div>

                <div class="mb-4">
                  <label for="registro-observacion" class="form-label">Observaciones y recomendaciones</label>
                  <textarea class="form-control" id="registro-observacion" rows="4"></textarea>
                  <small class="text-muted">Notas clínicas, recomendaciones al paciente, tratamiento, follow-up...</small>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-600">Servicios prestados *</label>
                  <div id="registro-servicios-container">
                    <div id="registro-servicios-grid" class="row row-cols-1 row-cols-md-2 g-2"></div>
                  </div>
                </div>
              </div>

              <div class="col-lg-3">
                <div class="card shadow-sm">
                  <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h6 class="card-title">Signos vitales</h6>
                        <small class="text-muted">Registra datos por consulta</small>
                      </div>
                      <i class="fas fa-heartbeat text-danger"></i>
                    </div>

                    <div class="mb-3">
                      <label class="form-label small mb-1">Presión arterial</label>
                      <input type="text" class="form-control" id="signos-presion" placeholder="Ej: 120/80">
                    </div>

                    <div class="mb-3">
                      <label class="form-label small mb-1">Frecuencia cardíaca (lpm)</label>
                      <input type="number" step="1" class="form-control" id="signos-frecuencia-cardiaca" placeholder="Ej: 72">
                    </div>

                    <div class="mb-3">
                      <label class="form-label small mb-1">Temperatura (°C)</label>
                      <input type="number" step="0.1" class="form-control" id="signos-temperatura" placeholder="Ej: 36.5">
                    </div>

                    <div class="mb-3">
                      <label class="form-label small mb-1">Saturación de O<sub>2</sub> (%)</label>
                      <input type="number" step="0.1" class="form-control" id="signos-saturacion" placeholder="Ej: 98">
                    </div>

                    <div class="mb-3">
                      <label class="form-label small mb-1">Peso (kg)</label>
                      <input type="number" step="0.1" class="form-control" id="signos-peso" placeholder="Ej: 70">
                    </div>

                    <div>
                      <label class="form-label small mb-1">Talla (cm)</label>
                      <input type="number" step="0.1" class="form-control" id="signos-estatura" placeholder="Ej: 165">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 d-flex gap-2 justify-content-end">
              <button type="submit" class="btn btn-primary">Guardar Consulta</button>
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  
  document.body.appendChild(modalDiv);
  return modalDiv;
}
