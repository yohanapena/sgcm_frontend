import {
  getCitasHoy,
  getHistoriaClinica,
  getTodasCitasMedico,
  registrarConsultaConServicios,
  getServicios,
} from './medicoService.js';

let medicoActual = null;
let serviciosDisponibles = [];
let todasCitas = [];
let citasHoy = [];

// DOM Elements
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

  serviciosDisponibles = await getServicios();
  console.log('🏥 Servicios cargados:', serviciosDisponibles.length);

  citasHoy = await getCitasHoy(medicoActual);
  todasCitas = await getTodasCitasMedico(medicoActual);

  console.log('📅 Citas de hoy:', citasHoy.length);
  console.log('📅 Todas las citas:', todasCitas.length);

  initializeUI();
  renderDashboardStats();
}

function initializeUI() {
  citasSearch = document.getElementById('medico-citas-search');
  citasSearchBtn = document.getElementById('medico-citas-search-btn');
  citasTableBody = document.getElementById('medico-citas-table-body');
  citasFilterSelect = document.getElementById('medico-citas-filter');

  const registroModalDiv = document.getElementById('registro-consulta-modal');
  if (registroModalDiv) {
    registroConsultaModal = new bootstrap.Modal(registroModalDiv);
  }

  registroConsultaForm = document.getElementById('registro-consulta-form');

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

  renderCitasTable(citasHoy);
}

function renderDashboardStats() {
  const hoy = new Date().toISOString().split('T')[0];
  const citasHoyCount = todasCitas.filter((c) => c.fecha === hoy).length;
  const citasPendientes = todasCitas.filter((c) => c.estado === 'Agendada' || c.estado === 'Pendiente').length;
  const citasAtendidas = todasCitas.filter((c) => c.estado === 'Atendida' || c.estado === 'Completada').length;

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
            <i class="fas fa-stethoscope"></i> Registrar
          </button>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-secondary verDetallesBtn" data-cita-id="${cita.id_cita}">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `)
    .join('');

  citasTableBody.querySelectorAll('.abrirConsultaBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const citaId = parseInt(e.currentTarget.dataset.citaId, 10);
      const cita = todasCitas.find((c) => c.id_cita === citaId);
      if (cita) {
        currentCitaForConsulta = cita;
        abrirRegistroConsultaModal(cita);
      }
    });
  });

  citasTableBody.querySelectorAll('.verDetallesBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const citaId = parseInt(e.currentTarget.dataset.citaId, 10);
      const cita = todasCitas.find((c) => c.id_cita === citaId);
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

  const filtered = todasCitas.filter((cita) =>
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
    filtered = todasCitas.filter((c) => c.fecha === hoy);
  } else if (filterValue === 'pendientes') {
    filtered = todasCitas.filter((c) => c.estado === 'Agendada' || c.estado === 'Pendiente');
  } else if (filterValue === 'atendidas') {
    filtered = todasCitas.filter((c) => c.estado === 'Atendida' || c.estado === 'Completada');
  } else if (filterValue === 'todas') {
    filtered = todasCitas;
  }

  renderCitasTable(filtered);
}

async function abrirRegistroConsultaModal(cita) {
  const citaHiddenInput = document.getElementById('registro-cita-id');
  if (citaHiddenInput) citaHiddenInput.value = cita.id_cita;

  // Limpiar campos de entrada
  const diagnosticoInput = document.getElementById('registro-diagnostico');
  const observacionInput = document.getElementById('registro-observacion');
  if (diagnosticoInput) diagnosticoInput.value = '';
  if (observacionInput) observacionInput.value = '';

  try {
    const datosHistoria = await getHistoriaClinica(cita.id_paciente_fk);
    const paciente = datosHistoria.paciente || {};
    const historia = datosHistoria.historia || {};
    const consultasAntes = datosHistoria.consultasAntes || [];

    // ========================================
    // 1. ENCABEZADO CLÍNICO RÁPIDO
    // ========================================
    const nombreEncabezado = document.getElementById('registro-encabezado-nombre');
    const edadEncabezado = document.getElementById('registro-encabezado-edad');
    const documentoEncabezado = document.getElementById('registro-encabezado-documento');
    const sangreEncabezado = document.getElementById('registro-encabezado-sangre');

    if (nombreEncabezado) {
      nombreEncabezado.textContent = `${paciente.nombre || '-'} ${paciente.primer_apellido || ''}`.trim();
    }
    if (documentoEncabezado) {
      documentoEncabezado.textContent = paciente.numero_identificacion || '—';
    }

    // Calcular edad
    if (edadEncabezado) {
      const fechaNac = paciente.fecha_de_nacimiento ? new Date(paciente.fecha_de_nacimiento) : null;
      if (fechaNac && !Number.isNaN(fechaNac.getTime())) {
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
        edadEncabezado.textContent = `${edad} años`;
      } else {
        edadEncabezado.textContent = '—';
      }
    }

    // Tipo de sangre (simulado)
    if (sangreEncabezado) {
      const tipos = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
      const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)];
      sangreEncabezado.textContent = tipoAleatorio;
    }

    // ========================================
    // 2. ALERGIAS - Alertas visuales importantes
    // ========================================
    const alergiasContainer = document.getElementById('registro-alergias-container');
    const alergiasDiv = document.getElementById('registro-alergias');

    if (alergiasContainer && alergiasDiv) {
      // Simular alergias desde datos (en futuro vendrá del paciente)
      const alergias = paciente.alergias ? 
        (Array.isArray(paciente.alergias) ? paciente.alergias : [paciente.alergias]) 
        : [];

      // Alergias comunes simuladas para demostración
      const alergiasDemo = ['Penicilina', 'Ibuprofeno'];

      if (alergias.length > 0 || alergiasDemo.length > 0) {
        const todasAlergias = alergias.length > 0 ? alergias : alergiasDemo;
        alergiasDiv.innerHTML = todasAlergias
          .map(
            (alergia) => `
            <div class=\"alert alert-warning alert-sm py-2 px-3 mb-0\" style=\"display: inline-block; border-radius: 20px; font-size: 0.85rem;\">
              <i class=\"fas fa-exclamation-triangle\"></i> <strong>Alergia:</strong> ${alergia}
            </div>
          `
          )
          .join('');
        alergiasContainer.style.display = 'block';
      } else {
        alergiasContainer.style.display = 'none';
      }
    }

    // ========================================
    // 3. ANTECEDENTES IMPORTANTES
    // ========================================
    const antecedentesEl = document.getElementById('registro-antecedentes');
    if (antecedentesEl) {
      const antecedentes = historia.antecedentes || 
        'Hipertensión controlada | Diabetes tipo 2 | Sin antecedentes quirúrgicos';
      antecedentesEl.textContent = antecedentes || 'Sin antecedentes registrados';
    }

    // ========================================
    // 4. RESUMEN CLÍNICO
    // ========================================
    const resumenEl = document.getElementById('registro-historia-resumen');
    if (resumenEl) {
      resumenEl.textContent = historia.resumen || 'Sin información clínica disponible en el registro.';
    }

    // ========================================
    // 5. CONSULTAS PREVIAS - Mejorada
    // ========================================
    const consultasPreviasEl = document.getElementById('registro-consultas-previas');
    if (consultasPreviasEl) {
      if (consultasAntes.length === 0) {
        consultasPreviasEl.innerHTML = `
          <div class=\"text-center text-muted small py-3\">
            <i class=\"fas fa-history\"></i> Esta es la primera consulta
          </div>
        `;
      } else {
        consultasPreviasEl.innerHTML = consultasAntes
          .map(
            (consulta, idx) => `
            <div class=\"card card-sm mb-2\" style=\"border-left: 4px solid #0dcaf0;\">
              <div class=\"card-body p-2\">\n                <div class=\"d-flex justify-content-between align-items-start mb-1\">\n                  <small class=\"fw-600 text-dark\">${consulta.fecha_consulta || consulta.fecha || 'Fecha no disponible'}</small>\n                  <span class=\"badge bg-secondary\" style=\"font-size: 0.7rem;\">Consulta ${idx + 1}</span>\n                </div>\n                <div class=\"small fw-600 text-primary mb-1\">Diagnóstico:</div>\n                <div class=\"small text-dark mb-2\">${consulta.diagnostico || 'Sin diagnóstico registrado'}</div>\n                ${consulta.observacion ? `<div class=\"small text-muted\"><strong>Nota:</strong> ${consulta.observacion}</div>` : ''}\n              </div>\n            </div>\n          `
          )
          .join('');
      }
    }

    // ========================================
    // 6. SERVICIOS PRESTADOS - Mejor visualización
    // ========================================
    const serviciosGrid = document.getElementById('registro-servicios-grid');
    if (serviciosGrid) {
      serviciosGrid.innerHTML = serviciosDisponibles
        .map(
          (servicio) => `
          <div class=\"col\">\n            <div class=\"form-check form-check-inline\" style=\"display: block; padding: 0;\">
              <input class=\"form-check-input servicio-check\" type=\"checkbox\" id=\"servicio-${servicio.id_servicio}\" value=\"${servicio.id_servicio}\" style=\"width: 18px; height: 18px; cursor: pointer;\">
              <label class=\"form-check-label\" for=\"servicio-${servicio.id_servicio}\" style=\"cursor: pointer; margin-left: 8px; font-size: 0.9rem; user-select: none;\">\n                <i class=\"fas fa-check-circle text-success\" style=\"opacity: 0.3;\"></i> ${servicio.nombre}\n              </label>\n            </div>\n          </div>\n        `
        )
        .join('');
    }

  } catch (error) {
    console.warn('No se pudo cargar historia clínica:', error);
    // Fallback: mostrar valores por defecto
    document.getElementById('registro-encabezado-nombre').textContent = `Paciente ${cita.id_paciente_fk}`;
    document.getElementById('registro-historia-resumen').textContent = 'No disponible';
  }

  if (registroConsultaModal) {
    registroConsultaModal.show();
  }
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
    (ch) => parseInt(ch.value, 10)
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
    if (registroConsultaModal) registroConsultaModal.hide();
    registroConsultaForm?.reset();

    citasHoy = await getCitasHoy(medicoActual);
    todasCitas = await getTodasCitasMedico(medicoActual);
    renderDashboardStats();
    handleFilterCitas();
  } catch (error) {
    console.error('Error registrando consulta:', error);
    alert('❌ Error al registrar la consulta: ' + (error.message || error));
  }
}

function mostrarDetallesCita(cita) {
  alert(`Cita del ${cita.fecha} a las ${cita.hora}\nPaciente: ${cita.id_paciente_fk}\nEstado: ${cita.estado}\nObservación: ${cita.observacion || 'N/A'}`);
}

function getEstadoBadgeColor(estado) {
  const estadoLower = estado?.toLowerCase() || '';
  if (estadoLower.includes('agendada') || estadoLower.includes('pendiente')) return 'warning';
  if (estadoLower.includes('atendida') || estadoLower.includes('completada')) return 'success';
  if (estadoLower.includes('cancelada') || estadoLower.includes('rechazada')) return 'danger';
  return 'secondary';
}
