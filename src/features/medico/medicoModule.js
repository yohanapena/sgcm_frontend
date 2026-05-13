import {
  getCitasHoy,
  getHistoriaClinica,
  getTodasCitasMedico,
  registrarConsultaConServicios,
  getServicios,
  buscarPacientes,
} from './medicoService.js';
import { showToast } from '../../utils/toast.js';

let medicoActual = null;
let serviciosDisponibles = [];
let todasCitas = [];
let citasHoy = [];

let btnMisCitas = null;
let misCitasLista = null;
let busquedaPacienteInput = null;
let btnBuscarPaciente = null;
let resultadosBusquedaDiv = null;
let historiaClinicaTimeline = null;
let pacienteInfo = {
  nombre: null,
  identificacion: null,
  nacimiento: null,
  eps: null,
  regimen: null,
  direccion: null,
  movil: null,
  email: null,
  whatsapp: null,
};

// DOM Elements
let citasSearch;
let citasSearchBtn;
let citasTableBody;
let citasFilterSelect;
let registroConsultaModal;
let registroConsultaForm;
let currentCitaForConsulta = null;

export async function mountMedicoModule(user) {
  console.log('🔄 Iniciando carga de módulo médico...');
  try {
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
    renderMisCitas();
    // Cargar lista inicial de pacientes para historial clínico
    handleBuscarPaciente();
    console.log('✅ Módulo médico cargado correctamente');
  } catch (error) {
    console.error('❌ Error al cargar módulo médico:', error);
    throw error;
  }
}

function initializeUI() {
  console.log('🔧 Inicializando UI del módulo médico...');
  try {
    citasSearch = document.getElementById('medico-citas-search');
    citasSearchBtn = document.getElementById('medico-citas-search-btn');
    citasTableBody = document.getElementById('medico-citas-table-body');
    citasFilterSelect = document.getElementById('medico-citas-filter');
    btnMisCitas = document.getElementById('btn-mis-citas');
    misCitasLista = document.getElementById('mis-citas-lista');
    busquedaPacienteInput = document.getElementById('busqueda-paciente');
    btnBuscarPaciente = document.getElementById('btn-buscar-paciente');
    resultadosBusquedaDiv = document.getElementById('resultados-busqueda');
    historiaClinicaTimeline = document.getElementById('historia-clinica-timeline');
    pacienteInfo.nombre = document.getElementById('historia-paciente-nombre');
    pacienteInfo.identificacion = document.getElementById('historia-paciente-identificacion');
    pacienteInfo.nacimiento = document.getElementById('historia-paciente-nacimiento');
    pacienteInfo.eps = document.getElementById('historia-paciente-eps');
    pacienteInfo.regimen = document.getElementById('historia-paciente-regimen');
    pacienteInfo.direccion = document.getElementById('historia-paciente-direccion');
    pacienteInfo.movil = document.getElementById('historia-paciente-movil');
    pacienteInfo.email = document.getElementById('historia-paciente-email');
    pacienteInfo.whatsapp = document.getElementById('historia-paciente-whatsapp');

    console.log('✓ Elementos encontrados:', {
      citasSearch: !!citasSearch,
      citasTableBody: !!citasTableBody,
      btnBuscarPaciente: !!btnBuscarPaciente,
      misCitasLista: !!misCitasLista
    });

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

  if (btnMisCitas) {
    btnMisCitas.addEventListener('click', renderMisCitas);
  }

  if (btnBuscarPaciente) {
    btnBuscarPaciente.addEventListener('click', handleBuscarPaciente);
  }

  if (busquedaPacienteInput) {
    busquedaPacienteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBuscarPaciente();
      }
    });
  }

  if (citasFilterSelect) {
    citasFilterSelect.addEventListener('change', handleFilterCitas);
  }

  // Dashboard cards click handlers
  const citasHoyCard = document.getElementById('medico-citas-hoy-card');
  const citasAtendidasCard = document.getElementById('medico-citas-atendidas-card');
  const citasPendientesCard = document.getElementById('medico-citas-pendientes-card');

  if (citasHoyCard) {
    citasHoyCard.addEventListener('click', () => {
      citasFilterSelect.value = 'hoy';
      handleFilterCitas();
    });
  }

  if (citasAtendidasCard) {
    citasAtendidasCard.addEventListener('click', () => {
      citasFilterSelect.value = 'atendidas';
      handleFilterCitas();
    });
  }

  if (citasPendientesCard) {
    citasPendientesCard.addEventListener('click', () => {
      citasFilterSelect.value = 'pendientes';
      handleFilterCitas();
    });
  }

  renderCitasTable(citasHoy);
  } catch (error) {
    console.error('❌ Error al inicializar UI del módulo médico:', error);
  }
}

function renderDashboardStats() {
  const hoy = new Date().toISOString().split('T')[0];
  const citasHoyCount = todasCitas.filter((c) => c.fecha === hoy).length;
  const citasPendientes = todasCitas.filter((c) => c.estado === 'Agendada').length;
  const citasAtendidas = todasCitas.filter((c) => c.estado === 'Atendida').length;

  const citasHoyEl = document.getElementById('medico-citas-hoy-count');
  const citasPendientesEl = document.getElementById('medico-citas-pendientes-count');
  const citasAtendidasEl = document.getElementById('medico-citas-atendidas-count');

  if (citasHoyEl) citasHoyEl.textContent = citasHoyCount;
  if (citasPendientesEl) citasPendientesEl.textContent = citasPendientes;
  if (citasAtendidasEl) citasAtendidasEl.textContent = citasAtendidas;
}

function renderMisCitas(citas = todasCitas) {
  if (!misCitasLista) return;

  if (!citas || citas.length === 0) {
    misCitasLista.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="fas fa-inbox"></i> No hay citas registradas.
      </div>
    `;
    return;
  }

  misCitasLista.innerHTML = citas
    .map((cita) => `
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <strong>${cita.fecha}</strong> • ${cita.hora}
          </div>
          <span class="badge bg-${getEstadoBadgeColor(cita.estado)}">${cita.estado}</span>
        </div>
        <div class="card-body">
          <p class="mb-1"><strong>Paciente:</strong> ${cita.id_paciente_fk}</p>
          <p class="mb-1"><strong>Observación:</strong> ${cita.observacion || 'Sin observaciones'}</p>
          <div class="d-flex gap-2 flex-wrap mt-3">
            ${cita.estado === 'Atendida' 
              ? `<button class="btn btn-sm btn-info verObservacionesBtn" data-cita-id="${cita.id_cita}">
                  <i class="fas fa-notes-medical"></i> Ver observaciones
                </button>`
              : `<button class="btn btn-sm btn-primary abrirConsultaBtn" data-cita-id="${cita.id_cita}">
                  <i class="fas fa-stethoscope"></i> Registrar consulta
                </button>`
            }
            <button class="btn btn-sm btn-outline-secondary verDetallesBtn" data-cita-id="${cita.id_cita}">
              <i class="fas fa-eye"></i> Ver detalles
            </button>
          </div>
        </div>
      </div>
    `)
    .join('');

  misCitasLista.querySelectorAll('.abrirConsultaBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const citaId = parseInt(e.currentTarget.dataset.citaId, 10);
      const cita = todasCitas.find((c) => c.id_cita === citaId);
      if (cita) {
        currentCitaForConsulta = cita;
        abrirRegistroConsultaModal(cita);
      }
    });
  });

  misCitasLista.querySelectorAll('.verDetallesBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const citaId = parseInt(e.currentTarget.dataset.citaId, 10);
      const cita = todasCitas.find((c) => c.id_cita === citaId);
      if (cita) {
        mostrarDetallesCita(cita);
      }
    });
  });

  misCitasLista.querySelectorAll('.verObservacionesBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const citaId = parseInt(e.currentTarget.dataset.citaId, 10);
      const cita = todasCitas.find((c) => c.id_cita === citaId);
      if (cita) {
        mostrarObservacionesCita(cita);
      }
    });
  });
}

async function handleBuscarPaciente() {
  const query = busquedaPacienteInput?.value.trim();

  resultadosBusquedaDiv.innerHTML = `<div class="text-muted small">Buscando paciente...</div>`;
  try {
    const pacientes = await buscarPacientes(query || ''); // Si vacío, buscar todos
    if (!pacientes || pacientes.length === 0) {
      resultadosBusquedaDiv.innerHTML = `
        <div class="alert alert-info">No se encontraron pacientes con esa búsqueda.</div>
      `;
      return;
    }

    resultadosBusquedaDiv.innerHTML = pacientes
      .map(
        (paciente) => `
          <div class="card mb-2">
            <div class="card-body d-flex justify-content-between align-items-start gap-3 flex-column flex-md-row">
              <div>
                <p class="mb-1"><strong>${paciente.nombre} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}</strong></p>
                <p class="mb-1"><strong>Documento:</strong> ${paciente.numero_identificacion || 'N/A'}</p>
                <p class="mb-0"><strong>Edad:</strong> ${paciente.fecha_de_nacimiento ? calcularEdad(paciente.fecha_de_nacimiento) + ' años' : 'N/A'}</p>
              </div>
              <div class="d-flex gap-2 flex-wrap mt-2 mt-md-0">
                <button class="btn btn-sm btn-primary ver-historia-btn" data-paciente-id="${paciente.id_paciente}">
                  <i class="fas fa-search"></i> Consultar
                </button>
              </div>
            </div>
          </div>
        `
      )
      .join('');

    resultadosBusquedaDiv.querySelectorAll('.ver-historia-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const pacienteId = parseInt(event.currentTarget.dataset.pacienteId, 10);
        const paciente = pacientes.find((p) => p.id_paciente === pacienteId);
        if (paciente) {
          await mostrarHistoriaClinica(paciente);
        }
      });
    });
  } catch (error) {
    console.error('Error buscando paciente:', error);
    resultadosBusquedaDiv.innerHTML = `
      <div class="alert alert-danger">Error al buscar paciente. Revisa la consola.</div>
    `;
  }
}

async function mostrarHistoriaClinica(paciente) {
  if (!paciente) return;

  // Ocultar lista de pacientes
  if (resultadosBusquedaDiv) resultadosBusquedaDiv.style.display = 'none';

  // Mostrar cards de info y historia
  const pacienteInfoCard = document.getElementById('paciente-info-card');
  const historiaClinicaCard = document.getElementById('historia-clinica-card');
  if (pacienteInfoCard) pacienteInfoCard.style.display = 'block';
  if (historiaClinicaCard) historiaClinicaCard.style.display = 'block';

  actualizarInfoPaciente(paciente);
  historiaClinicaTimeline.innerHTML = `<div class="text-muted small">Cargando historia clínica...</div>`;

  try {
    const datosHistoria = await getHistoriaClinica(paciente.id_paciente);
    const historia = datosHistoria.historia || {};
    const consultasAntes = datosHistoria.consultasAntes || [];

    historiaClinicaTimeline.innerHTML = `
      <div class="mb-3">
        <button class="btn btn-sm btn-outline-secondary" id="volver-lista-pacientes">
          <i class="fas fa-arrow-left"></i> Volver a lista de pacientes
        </button>
      </div>
      <div class="mb-3">
        <h5>Resumen clínico</h5>
        <p class="mb-0 text-muted">${historia.resumen || 'No hay resumen clínico disponible para este paciente.'}</p>
      </div>
      <div>
        <h5>Consultas previas</h5>
        ${consultasAntes.length === 0 ? '<p class="text-muted">No se encontraron consultas previas.</p>' : ''}
        ${consultasAntes
          .map(
            (consulta) => `
              <div class="card mb-2">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                  <div>${consulta.fecha_consulta || consulta.fecha || 'Fecha no disponible'}</div>
                  <span class="badge bg-secondary">Consulta</span>
                </div>
                <div class="card-body">
                  <p class="mb-1"><strong>Médico:</strong> ${consulta.nombre_medico || 'Dr. Juan Díaz'} (${consulta.especialidad || 'Medicina General'})</p>
                  <p class="mb-1"><strong>Diagnóstico:</strong> ${consulta.diagnostico || 'Sin diagnóstico'}</p>
                  <p class="mb-1"><strong>Observación:</strong> ${consulta.observacion || 'Sin observación'}</p>
                  ${consulta.servicios_ids ? `<p class="mb-0"><strong>Servicios:</strong> ${Array.isArray(consulta.servicios_ids) ? consulta.servicios_ids.join(', ') : consulta.servicios_ids}</p>` : ''}
                </div>
              </div>
            `
          )
          .join('')}
      </div>
    `;

    // Agregar listener al botón volver
    const volverBtn = document.getElementById('volver-lista-pacientes');
    if (volverBtn) {
      volverBtn.addEventListener('click', () => {
        if (resultadosBusquedaDiv) resultadosBusquedaDiv.style.display = 'block';
        const pacienteInfoCard = document.getElementById('paciente-info-card');
        const historiaClinicaCard = document.getElementById('historia-clinica-card');
        if (pacienteInfoCard) pacienteInfoCard.style.display = 'none';
        if (historiaClinicaCard) historiaClinicaCard.style.display = 'none';
        historiaClinicaTimeline.innerHTML = '';
        // Limpiar info paciente
        Object.values(pacienteInfo).forEach(el => {
          if (el) el.textContent = '—';
        });
      });
    }
  } catch (error) {
    console.error('Error cargando historia clínica:', error);
    historiaClinicaTimeline.innerHTML = `
      <div class="alert alert-danger">No se pudo cargar la historia clínica del paciente.</div>
    `;
  }
}

function actualizarInfoPaciente(paciente) {
  if (pacienteInfo.nombre) pacienteInfo.nombre.textContent = `${paciente.nombre || '-'} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim();
  if (pacienteInfo.identificacion) pacienteInfo.identificacion.textContent = paciente.numero_identificacion || '—';
  if (pacienteInfo.nacimiento) pacienteInfo.nacimiento.textContent = paciente.fecha_de_nacimiento ? new Date(paciente.fecha_de_nacimiento).toLocaleDateString() : '—';
  if (pacienteInfo.eps) pacienteInfo.eps.textContent = paciente.eps || 'No disponible';
  if (pacienteInfo.regimen) pacienteInfo.regimen.textContent = paciente.regimen || 'No disponible';
  if (pacienteInfo.direccion) pacienteInfo.direccion.textContent = paciente.direccion || 'No disponible';
  if (pacienteInfo.movil) pacienteInfo.movil.textContent = paciente.telefono || 'No disponible';
  if (pacienteInfo.email) pacienteInfo.email.textContent = paciente.email || 'No disponible';
  if (pacienteInfo.whatsapp) pacienteInfo.whatsapp.textContent = paciente.whatsapp || paciente.telefono || 'No disponible';
}

function calcularEdad(fechaNacimiento) {
  const fecha = new Date(fechaNacimiento);
  if (!fecha || Number.isNaN(fecha.getTime())) return 'N/A';
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad -= 1;
  return edad;
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
    .map((cita) => {
      const pacienteNombre = cita.paciente?.nombre || cita.paciente_nombre || cita.nombre_paciente || cita.pacienteNombre || '';
      const pacienteApellido = cita.paciente?.primer_apellido || cita.paciente?.segundo_apellido || cita.paciente_apellido || cita.pacienteApellido || cita.paciente?.apellido || '';
      const pacienteEtiqueta = pacienteNombre
        ? `${pacienteNombre}${pacienteApellido ? ` ${pacienteApellido}` : ''}`
        : 'Paciente sin datos';

      return `
      <tr>
        <td>${cita.fecha}</td>
        <td>${cita.hora}</td>
        <td>${pacienteEtiqueta}</td>
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
    `;
    })
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
    filtered = todasCitas.filter((c) => c.estado === 'Agendada');
  } else if (filterValue === 'atendidas') {
    filtered = todasCitas.filter((c) => c.estado === 'Atendida');
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

    // Tipo de sangre del paciente
    if (sangreEncabezado) {
      const tipoSangre = paciente.tipo_sangre || paciente.grupo_sanguineo || 'No registrado';
      sangreEncabezado.textContent = tipoSangre;
    }

    // ========================================
    // 2. ALERGIAS - Alertas visuales importantes
    // ========================================
    const alergiasContainer = document.getElementById('registro-alergias-container');
    const alergiasDiv = document.getElementById('registro-alergias');

    if (alergiasContainer && alergiasDiv) {
      // TODO: consumir desde API de historial clínico
      const alergias = Array.isArray(paciente.alergias)
        ? paciente.alergias
        : paciente.alergias
          ? [paciente.alergias]
          : Array.isArray(paciente.historial?.alergias)
            ? paciente.historial.alergias
            : paciente.historial?.alergias
              ? [paciente.historial.alergias]
              : [];

      if (alergias.length > 0) {
        alergiasDiv.innerHTML = alergias
          .map(
            (alergia) => `
            <div class="alert alert-warning alert-sm py-2 px-3 mb-0" style="display: inline-block; border-radius: 20px; font-size: 0.85rem;">
              <i class="fas fa-exclamation-triangle"></i> <strong>Alergia:</strong> ${alergia}
            </div>
          `
          )
          .join('');
      } else {
        alergiasDiv.innerHTML = `
          <div class="text-muted small">No registrado</div>
        `;
      }
      alergiasContainer.style.display = 'block';
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
    showToast('Error: No hay cita seleccionada', 'error');
    return;
  }

  const diagnostico = document.getElementById('registro-diagnostico')?.value.trim();
  const observacion = document.getElementById('registro-observacion')?.value.trim();
  const serviciosSeleccionados = Array.from(document.querySelectorAll('.servicio-check:checked')).map(
    (ch) => parseInt(ch.value, 10)
  );

  // Validaciones
  if (!diagnostico) {
    showToast('El diagnóstico es requerido', 'error');
    return;
  }

  if (serviciosSeleccionados.length === 0) {
    showToast('Debe seleccionar al menos un servicio', 'error');
    return;
  }

  // Validar signos vitales
  const signosVitales = {
    frecuenciaCardiaca: parseFloat(document.getElementById('signos-frecuencia-cardiaca')?.value) || 0,
    temperatura: parseFloat(document.getElementById('signos-temperatura')?.value) || 0,
    saturacion: parseFloat(document.getElementById('signos-saturacion')?.value) || 0,
    peso: parseFloat(document.getElementById('signos-peso')?.value) || 0,
    estatura: parseFloat(document.getElementById('signos-estatura')?.value) || 0,
    presion: document.getElementById('signos-presion')?.value.trim() || '',
  };

  const validationError = validateSignosVitales(signosVitales);
  if (validationError) {
    showToast(validationError, 'error');
    return;
  }

  try {
    await registrarConsultaConServicios({
      id_cita_fk: currentCitaForConsulta.id_cita,
      diagnostico,
      observacion,
      servicios_ids: serviciosSeleccionados,
      signos_vitales: signosVitales, // Agregar signos vitales al payload
    });

    showToast('Consulta registrada exitosamente', 'success');
    if (registroConsultaModal) registroConsultaModal.hide();
    registroConsultaForm?.reset();

    citasHoy = await getCitasHoy(medicoActual);
    todasCitas = await getTodasCitasMedico(medicoActual);
    renderDashboardStats();
    handleFilterCitas();
  } catch (error) {
    console.error('Error registrando consulta:', error);
    showToast('Error al registrar la consulta: ' + (error.message || error), 'error');
  }
}

async function mostrarObservacionesCita(cita) {
  try {
    const datosHistoria = await getHistoriaClinica(cita.id_paciente_fk);
    const consultas = datosHistoria.consultasAntes || [];

    // Filtrar consultas relacionadas con esta cita
    const consultasCita = consultas.filter(c => c.id_cita_fk === cita.id_cita);

    let contenido = `<h5>Observaciones de la Consulta</h5>
                     <p><strong>Paciente:</strong> ${datosHistoria.paciente?.nombre || 'N/A'} ${datosHistoria.paciente?.primer_apellido || ''}</p>
                     <p><strong>Fecha:</strong> ${cita.fecha} ${cita.hora}</p>`;

    if (consultasCita.length > 0) {
      contenido += '<h6>Consultas Registradas:</h6>';
      consultasCita.forEach(consulta => {
        contenido += `
          <div class="border p-2 mb-2 rounded">
            <p><strong>Médico:</strong> ${consulta.nombre_medico || 'Dr. Juan Díaz'} (${consulta.especialidad || 'Medicina General'})</p>
            <p><strong>Fecha:</strong> ${consulta.fecha_consulta || consulta.fecha || 'N/A'}</p>
            <p><strong>Diagnóstico:</strong> ${consulta.diagnostico || 'N/A'}</p>
            <p><strong>Observación:</strong> ${consulta.observacion || 'N/A'}</p>
            <p><strong>Servicios:</strong> ${consulta.servicios_ids ? consulta.servicios_ids.join(', ') : 'N/A'}</p>
          </div>
        `;
      });
    } else {
      contenido += '<p>No hay consultas registradas para esta cita.</p>';
    }

    // Mostrar en un modal simple
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Observaciones Médicas</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">${contenido}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
  } catch (error) {
    console.error('Error cargando observaciones:', error);
    showToast('Error al cargar las observaciones de la cita.', 'error');
  }
}

function mostrarDetallesCita(cita) {
  showToast(
    `Cita del ${cita.fecha} a las ${cita.hora}\nPaciente: ${cita.id_paciente_fk}\nEstado: ${cita.estado}\nObservación: ${cita.observacion || 'N/A'}`,
    'info'
  );
}

function getEstadoBadgeColor(estado) {
  const estadoLower = estado?.toLowerCase() || '';
  if (estadoLower === 'agendada') return 'warning';
  if (estadoLower === 'atendida') return 'success';
  if (estadoLower === 'cancelada') return 'danger';
  return 'secondary';
}

function validateSignosVitales(signos) {
  if (signos.frecuenciaCardiaca < 0) return 'La frecuencia cardíaca no puede ser negativa';
  if (signos.temperatura < 0) return 'La temperatura no puede ser negativa';
  if (signos.saturacion < 0 || signos.saturacion > 100) return 'La saturación debe estar entre 0 y 100';
  if (signos.peso < 0) return 'El peso no puede ser negativo';
  if (signos.estatura < 0) return 'La estatura no puede ser negativa';
  if (signos.presion && !/^\d{2,3}\/\d{2,3}$/.test(signos.presion)) return 'La presión arterial debe tener formato válido (ej: 120/80)';
  return null; // Válido
}
