import { searchPacientes, createPaciente } from '../pacientes/pacientesService.js';
import { createCita, getEspecialidades, getMedicos } from '../citas/citasService.js';
import { apiGateway } from '../../api/apiGateway.js';
import { showToast } from '../../utils/toast.js';

let currentAdminAppointmentFilter = 'todas';
const adminDashboardCache = {
  pacientes: [],
  citas: [],
  medicos: [],
};

// Nombres fijos de los pasos — fuente de verdad única
const WIZARD_STEP_LABELS = ['Paciente', 'Especialidad', 'Médico', 'Horario', 'Confirmar'];

export async function mountAdminModule() {
  console.log('🔄 Iniciando carga de módulo administrativo...');
  try {
    registerPatientForm();
    registerAppointmentWizard();
    registerAppointmentFilters();
    registerConsultationModal();
    registerTimelineButtons();
    await initDashboardAdmin();
    console.log('✅ Módulo administrativo cargado correctamente');
  } catch (error) {
    console.error('❌ Error al cargar módulo administrativo:', error);
    throw error;
  }
}

export async function initDashboardAdmin() {
  await renderAdministrativoDashboard();
  registerAdministrativoQuickActions();
  registerAdminDashboardFilterButtons();
}

function registerPatientForm() {
  const form = document.getElementById('patient-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = {
      numero_identificacion: document.getElementById('patient-num-id')?.value.trim() || '',
      fecha_de_nacimiento: document.getElementById('patient-birth-date')?.value || '',
      nombre: document.getElementById('patient-first-name')?.value.trim() || '',
      primer_apellido: document.getElementById('patient-last-name')?.value.trim() || '',
      segundo_apellido: document.getElementById('patient-second-last-name')?.value.trim() || '',
      direccion: document.getElementById('patient-address')?.value.trim() || '',
    };

    try {
      const response = await createPaciente(data);
      if (response?.id_paciente) {
        form.reset();
        showToast('Paciente creado correctamente', 'success');
      } else {
        showToast('Error al crear el paciente', 'error');
      }
    } catch (error) {
      console.error('Error creando paciente:', error);
      showToast('Error al crear el paciente: ' + error.message, 'error');
    }
  });
}

/**
 * Devuelve la fecha ISO (YYYY-MM-DD) del próximo día de la semana indicado.
 * Esta función es solo para uso en mocks/desarrollo y no debe usarse en producción
 * cuando el backend ya provee la fecha exacta del horario.
 * Ejemplo: getNextDateForDay('Lunes') → '2026-05-18'
 */
function getNextDateForDay(dayName) {
  const dayMap = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 0 };
  const target = dayMap[dayName];
  if (target === undefined) return new Date().toISOString().split('T')[0];
  const today = new Date();
  const current = today.getDay();
  const diff = (target - current + 7) % 7 || 7; // si es hoy, toma el de la próxima semana
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().split('T')[0];
}

function registerAppointmentWizard() {
  const wizardNav = Array.from(document.querySelectorAll('.wizard-nav-item'));
  const wizardSteps = Array.from(document.querySelectorAll('.wizard-step'));
  const patientSearchInput = document.getElementById('appointment-patient-search');
  const patientSearchBtn = document.getElementById('appointment-search-patient-btn');
  const patientResultsBody = document.getElementById('appointment-patient-results');
  const specialtyCardsContainer = document.getElementById('specialty-cards-container');
  const doctorContainer = document.getElementById('doctor-selection-container');
  const scheduleContainer = document.getElementById('schedule-slot-container');
  const confirmPatient = document.getElementById('confirm-paciente');
  const confirmIdentificacion = document.getElementById('confirm-identificacion');
  const confirmEps = document.getElementById('confirm-eps');
  const confirmMedico = document.getElementById('confirm-medico');
  const confirmEspecialidad = document.getElementById('confirm-especialidad');
  const confirmFechaHora = document.getElementById('confirm-fecha-hora');
  const observationsInput = document.getElementById('appointment-observations');
  const appointmentConfirmBtn = document.getElementById('appointment-confirm-btn');
  const step1Next = document.getElementById('appointment-step1-next');
  const step2Prev = document.getElementById('appointment-step2-prev');
  const step2Next = document.getElementById('appointment-step2-next');
  const step3Prev = document.getElementById('appointment-step3-prev');
  const step3Next = document.getElementById('appointment-step3-next');
  const step4Prev = document.getElementById('appointment-step4-prev');
  const step4Next = document.getElementById('appointment-step4-next');
  const step5Prev = document.getElementById('appointment-step5-prev');
  const step1Error = document.getElementById('step1-error');
  const step2Error = document.getElementById('step2-error');
  const step3Error = document.getElementById('step3-error');
  const step4Error = document.getElementById('step4-error');
  const selectedScheduleDisplay = document.getElementById('selected-schedule-display');

  if (wizardNav.length === 0 || wizardSteps.length === 0) return;

  let currentStep = 0;
  const citaWizard = {
    paciente: null,
    especialidad: null,
    medico: null,
    horario: null,
  };

  // ✅ CORRECCIÓN: goToStep usa WIZARD_STEP_LABELS como fuente fija
  // evita leer textContent del tab (que ya podría tener checkmarks/números duplicados)
  function goToStep(index) {
    wizardNav.forEach((item, idx) => {
      const label = WIZARD_STEP_LABELS[idx];
      const stepNumber = idx + 1;

      item.classList.remove('active', 'completed');

      if (idx < index) {
        item.classList.add('completed');
        item.innerHTML = `<i class="fas fa-check me-1"></i>${stepNumber}. ${label}`;
      } else if (idx === index) {
        item.classList.add('active');
        item.innerHTML = `${stepNumber}. ${label}`;
      } else {
        item.innerHTML = `${stepNumber}. ${label}`;
      }
    });

    wizardSteps.forEach((step, idx) => step.classList.toggle('active', idx === index));
    currentStep = index;

    if (index === 4) {
      renderConfirmation();
    }

    clearStepErrors();
  }

  function clearStepErrors() {
    [step1Error, step2Error, step3Error, step4Error].forEach((el) => {
      if (el) el.textContent = '';
    });
  }

  function getSpecialtyIcon(nombre) {
    const iconMap = {
      'Medicina General': 'fas fa-user-md',
      'Odontología': 'fas fa-tooth',
    };
    return iconMap[nombre] || 'fas fa-stethoscope';
  }

  async function populateSpecialties() {
    if (!specialtyCardsContainer) return;

    specialtyCardsContainer.innerHTML = '<div class="col-12 text-center text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Cargando especialidades...</div>';

    let especialidades = [];
    try {
      const response = await getEspecialidades();
      especialidades = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error cargando especialidades:', error);
      specialtyCardsContainer.innerHTML = '<div class="col-12 text-center text-danger py-3">Error al cargar especialidades.</div>';
      return;
    }

    specialtyCardsContainer.innerHTML = especialidades.map(
      (esp) => `
        <div class="col-md-6 mb-4">
          <div class="card specialty-card h-100" data-id="${esp.id_especialidad ?? esp.id}" style="cursor:pointer; transition: border 0.2s, box-shadow 0.2s;">
            <div class="card-body text-center d-flex flex-column justify-content-center py-4">
              <i class="${getSpecialtyIcon(esp.nombre)} fa-4x mb-3 text-primary"></i>
              <h5 class="card-title fw-semibold">${esp.nombre}</h5>
              <p class="card-text text-muted small">${esp.descripcion ?? ''}</p>
            </div>
          </div>
        </div>
      `
    ).join('');

    specialtyCardsContainer.querySelectorAll('.specialty-card').forEach((card) => {
      card.addEventListener('click', () => {
        specialtyCardsContainer.querySelectorAll('.specialty-card').forEach((c) => {
          c.classList.remove('selected');
          c.style.border = '';
          c.style.boxShadow = '';
        });
        card.classList.add('selected');
        card.style.border = '2px solid #1A6BB5';
        card.style.boxShadow = '0 0 0 3px rgba(26,107,181,0.15)';

        const especialidadId = Number(card.dataset.id);
        const especialidad = especialidades.find((e) => (e.id_especialidad ?? e.id) === especialidadId);
        citaWizard.especialidad = especialidad;
        citaWizard.medico = null;
        loadDoctors(especialidadId);
        if (step2Error) step2Error.textContent = '';
      });
    });
  }

  async function loadDoctors(especialidadId) {
    if (!doctorContainer) return;

    doctorContainer.innerHTML = '<div class="col-12 text-center text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Cargando médicos...</div>';

    let medicos = [];
    try {
      const response = await getMedicos();
      const todos = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      // Filtrar por especialidad si el médico tiene el campo id_especialidad_fk o especialidades[]
      medicos = todos.filter((m) => {
        if (Array.isArray(m.especialidades)) return m.especialidades.includes(especialidadId);
        if (m.id_especialidad_fk) return m.id_especialidad_fk === especialidadId;
        return true; // si el backend no filtra, mostramos todos
      });
    } catch (error) {
      console.error('Error cargando médicos:', error);
      doctorContainer.innerHTML = '<div class="col-12 text-center text-danger py-3">Error al cargar médicos.</div>';
      return;
    }

    if (medicos.length === 0) {
      doctorContainer.innerHTML = '<div class="col-12 text-center text-muted py-3">No hay médicos disponibles para esta especialidad.</div>';
      return;
    }

    doctorContainer.innerHTML = medicos.map(
      (medico) => `
        <div class="col-md-6 mb-3">
          <div class="card doctor-card h-100" data-id="${medico.id_medico ?? medico.id}" data-nombre="${medico.nombre} ${medico.primer_apellido ?? medico.apellido ?? ''}" style="cursor:pointer; transition: border 0.2s;">
            <div class="card-body text-center">
              <i class="fas fa-user-md fa-2x mb-2 text-primary"></i>
              <h6 class="card-title fw-semibold">${medico.nombre} ${medico.primer_apellido ?? medico.apellido ?? ''}</h6>
              <p class="card-text text-muted small">${medico.tarjeta_profesional ? `TP: ${medico.tarjeta_profesional}` : ''}</p>
            </div>
          </div>
        </div>
      `
    ).join('');

    doctorContainer.querySelectorAll('.doctor-card').forEach((card) => {
      card.addEventListener('click', () => {
        doctorContainer.querySelectorAll('.doctor-card').forEach((c) => {
          c.style.border = '';
          c.style.boxShadow = '';
        });
        card.style.border = '2px solid #1A6BB5';
        card.style.boxShadow = '0 0 0 3px rgba(26,107,181,0.15)';

        citaWizard.medico = {
          id_medico: Number(card.dataset.id),
          nombre: card.dataset.nombre,
        };
        if (step3Error) step3Error.textContent = '';
      });
    });
  }

  async function renderScheduleSlots() {
    if (!scheduleContainer) return;

    scheduleContainer.innerHTML = '<div class="text-center text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Cargando horarios...</div>';

    let horariosArray = [];
    try {
      const medicoId = citaWizard.medico?.id_medico;
      const response = await apiGateway({ resource: 'horarios', method: 'GET', params: medicoId ? { medico_id: medicoId } : {} });
      horariosArray = Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
      console.error('Error cargando horarios:', error);
      scheduleContainer.innerHTML = '<div class="text-center text-danger py-3">Error al cargar horarios.</div>';
      return;
    }

    // Transformar array en objeto agrupado por día
    const horariosRaw = {};
    horariosArray.forEach(horario => {
      if (!horariosRaw[horario.dia]) {
        horariosRaw[horario.dia] = [];
      }
      horariosRaw[horario.dia].push({
        hora: horario.hora,
        estado: 'disponible', // Por ahora todos disponibles, luego se puede filtrar por citas existentes
        fecha: null // No hay fecha específica en los datos actuales
      });
    });

    const days = Object.keys(horariosRaw);
    if (days.length === 0) {
      scheduleContainer.innerHTML = '<div class="text-center text-muted py-3">No hay horarios disponibles para este médico.</div>';
      return;
    }

    scheduleContainer.innerHTML = `
      <div class="d-flex justify-content-end mb-2 gap-3">
        <span><span class="badge" style="background:#d4edda; color:#155724; border:1px solid #c3e6cb;">●</span> Disponible</span>
        <span><span class="badge" style="background:#f8d7da; color:#721c24; border:1px solid #f5c6cb;">●</span> Ocupado</span>
        <span><span class="badge" style="background:#1A6BB5; color:#fff;">●</span> Seleccionado</span>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        ${days.map((day) => `
          <div class="calendar-day flex-fill" style="min-width:100px;">
            <div class="calendar-day-name fw-bold text-primary text-center mb-1">${day}</div>
            ${horariosRaw[day].map((slot) => `
              <div class="time-slot schedule-slot mb-1 text-center rounded p-1 ${slot.estado === 'disponible' ? 'clickable' : ''}"
                data-hora="${slot.hora}"
                data-day="${day}"
                data-fecha="${slot.fecha ?? ''}"
                style="
                  background: ${slot.estado === 'disponible' ? '#d4edda' : '#f8d7da'};
                  color: ${slot.estado === 'disponible' ? '#155724' : '#721c24'};
                  cursor: ${slot.estado === 'disponible' ? 'pointer' : 'not-allowed'};
                  border: 1px solid ${slot.estado === 'disponible' ? '#c3e6cb' : '#f5c6cb'};
                  font-size: 0.85rem;
                  transition: background 0.15s;
                ">
                ${slot.hora}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;

    scheduleContainer.querySelectorAll('.schedule-slot.clickable').forEach((slot) => {
      slot.addEventListener('click', () => {
        scheduleContainer.querySelectorAll('.schedule-slot').forEach((s) => {
          const day = s.dataset.day;
          const hora = s.dataset.hora;
          const originalSlot = horariosRaw[day]?.find((h) => h.hora === hora);
          if (originalSlot) {
            s.style.background = originalSlot.estado === 'disponible' ? '#d4edda' : '#f8d7da';
            s.style.color = originalSlot.estado === 'disponible' ? '#155724' : '#721c24';
            s.style.border = `1px solid ${originalSlot.estado === 'disponible' ? '#c3e6cb' : '#f5c6cb'}`;
          }
        });

        slot.style.background = '#1A6BB5';
        slot.style.color = '#fff';
        slot.style.border = '1px solid #1A6BB5';

        // Guardar fecha real si viene del backend, o el día como fallback
        citaWizard.horario = {
          dia: slot.dataset.day,
          hora: slot.dataset.hora,
          fecha: slot.dataset.fecha || null,
        };
        updateSelectedScheduleDisplay();
        if (step4Error) step4Error.textContent = '';
      });
    });
  }

  function updateSelectedScheduleDisplay() {
    if (selectedScheduleDisplay) {
      selectedScheduleDisplay.textContent = citaWizard.horario
        ? `Horario seleccionado: ${citaWizard.horario.dia} ${citaWizard.horario.hora}`
        : '';
    }
  }

  function renderConfirmation() {
    if (!citaWizard.paciente || !citaWizard.especialidad || !citaWizard.medico || !citaWizard.horario) return;

    if (confirmPatient) confirmPatient.textContent = `${citaWizard.paciente.nombre} ${citaWizard.paciente.primer_apellido}`;
    if (confirmIdentificacion) confirmIdentificacion.textContent = citaWizard.paciente.numero_identificacion;
    // Mostrar nombre de EPS si está disponible, no el ID
    const epsNombre = citaWizard.paciente.eps_nombre
      || citaWizard.paciente.eps
      || (citaWizard.paciente.id_eps_fk ? `EPS #${citaWizard.paciente.id_eps_fk}` : 'No registrado');
    if (confirmEps) confirmEps.textContent = epsNombre;
    if (confirmMedico) confirmMedico.textContent = citaWizard.medico.nombre;
    if (confirmEspecialidad) confirmEspecialidad.textContent = citaWizard.especialidad.nombre;
    const fechaDisplay = citaWizard.horario.fecha
      ? `${citaWizard.horario.fecha} ${citaWizard.horario.hora}`
      : `${citaWizard.horario.dia} ${citaWizard.horario.hora}`;
    if (confirmFechaHora) confirmFechaHora.textContent = fechaDisplay;
  }

  function resetWizard() {
    if (patientSearchInput) patientSearchInput.value = '';
    if (patientResultsBody) patientResultsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Busca un paciente para seleccionar</td></tr>';
    citaWizard.paciente = null;
    citaWizard.especialidad = null;
    citaWizard.medico = null;
    citaWizard.horario = null;
    if (observationsInput) observationsInput.value = '';
    if (doctorContainer) doctorContainer.innerHTML = '<div class="col-12"><p class="text-muted">Selecciona una especialidad primero para ver los médicos disponibles.</p></div>';
    if (scheduleContainer) scheduleContainer.innerHTML = '<div class="text-center text-muted py-3">Selecciona un médico primero para ver los horarios.</div>';
    populateSpecialties(); // async, no necesita await aquí
    updateSelectedScheduleDisplay();
    goToStep(0);
    clearStepErrors();
  }

  async function handleSearchPacientes() {
    const query = patientSearchInput?.value.trim();
    if (!query) {
      if (step1Error) step1Error.textContent = 'Ingrese un documento o nombre de paciente';
      return;
    }
    try {
      const response = await searchPacientes(query);
      const pacientes = response?.data || [];
      renderPatientResults(pacientes);
    } catch (error) {
      console.error('Error buscando pacientes:', error);
      if (step1Error) step1Error.textContent = 'Error al buscar pacientes';
    }
  }

  function renderPatientResults(pacientes) {
    if (!patientResultsBody) return;

    if (!pacientes || pacientes.length === 0) {
      patientResultsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No se encontraron pacientes.</td></tr>';
      return;
    }

    patientResultsBody.innerHTML = pacientes.map(
      (paciente) => `
        <tr>
          <td>${paciente.numero_identificacion}</td>
          <td>${paciente.nombre}</td>
          <td>${paciente.primer_apellido} ${paciente.segundo_apellido || ''}</td>
          <td>${paciente.id_eps_fk || 'No registrado'}</td>
          <td>
            <button type="button" class="btn btn-sm btn-primary select-patient-btn" data-id="${paciente.id_paciente}">Seleccionar</button>
          </td>
        </tr>
      `
    ).join('');

    patientResultsBody.querySelectorAll('.select-patient-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        const pacienteId = Number(event.target.dataset.id);
        const paciente = pacientes.find((item) => item.id_paciente === pacienteId);
        if (paciente) {
          citaWizard.paciente = paciente;
          if (step1Error) step1Error.textContent = '';
          highlightSelectedPatientRow(pacienteId);
          goToStep(1);
        }
      });
    });
  }

  function highlightSelectedPatientRow(id) {
    patientResultsBody.querySelectorAll('tr').forEach((row) => {
      row.classList.toggle('table-success', row.querySelector('.select-patient-btn')?.dataset.id == id);
    });
  }

  // Inicializar
  populateSpecialties(); // async, carga desde gateway
  goToStep(0);

  // Nueva cita reset
  document.getElementById('new-appointment-btn')?.addEventListener('click', resetWizard);

  // Navegación por tabs
  wizardNav.forEach((navItem, idx) => {
    navItem.addEventListener('click', () => goToStep(idx));
  });

  // Botones siguiente / anterior
  step1Next?.addEventListener('click', () => {
    if (!citaWizard.paciente) {
      if (step1Error) step1Error.textContent = 'Debes seleccionar un paciente';
      return;
    }
    goToStep(1);
  });

  step2Prev?.addEventListener('click', () => goToStep(0));
  step2Next?.addEventListener('click', () => {
    if (!citaWizard.especialidad) {
      if (step2Error) step2Error.textContent = 'Debes seleccionar una especialidad';
      return;
    }
    goToStep(2);
  });

  step3Prev?.addEventListener('click', () => goToStep(1));
  step3Next?.addEventListener('click', () => {
    if (!citaWizard.medico) {
      if (step3Error) step3Error.textContent = 'Debes seleccionar un médico';
      return;
    }
    goToStep(3);
    renderScheduleSlots(); // cargar horarios del médico seleccionado
  });

  step4Prev?.addEventListener('click', () => goToStep(2));
  step4Next?.addEventListener('click', () => {
    if (!citaWizard.horario) {
      if (step4Error) step4Error.textContent = 'Debes seleccionar un horario disponible';
      return;
    }
    goToStep(4);
  });

  step5Prev?.addEventListener('click', () => goToStep(3));

  appointmentConfirmBtn?.addEventListener('click', async () => {
    if (!citaWizard.paciente || !citaWizard.medico || !citaWizard.especialidad || !citaWizard.horario) {
      showWizardAlert('danger', 'Falta información para confirmar la cita.');
      return;
    }

    if (!citaWizard.horario?.fecha) {
      showWizardAlert('danger', 'La fecha del horario no está disponible. Regresa a selección de horario.');
      goToStep(3);
      return;
    }

    appointmentConfirmBtn.disabled = true;
    appointmentConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

    const payload = {
      fecha: citaWizard.horario.fecha,
      hora: citaWizard.horario.hora,
      id_paciente_fk: citaWizard.paciente.id_paciente,
      id_medico_fk: citaWizard.medico.id_medico,
      observacion: observationsInput?.value.trim() || 'Cita agendada desde módulo administrativo',
    };

    try {
      const response = await createCita(payload);
      if (response?.data) {
        showWizardAlert('success', `✓ Cita agendada exitosamente para ${citaWizard.paciente.nombre} ${citaWizard.paciente.primer_apellido}`);
        resetWizard();
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error creando cita:', error);
      showWizardAlert('danger', `Error al agendar cita: ${error.message}`);
    } finally {
      appointmentConfirmBtn.disabled = false;
      appointmentConfirmBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Confirmar Cita';
    }
  });

  patientSearchBtn?.addEventListener('click', handleSearchPacientes);
  patientSearchInput?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchPacientes();
    }
  });
}

function showWizardAlert(type, message) {
  const alertContainer = document.getElementById('wizard-alert-container');
  if (!alertContainer) return;

  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  setTimeout(() => {
    const alert = alertContainer.querySelector('.alert');
    if (alert) alert.remove();
  }, 5000);
}

function registerAppointmentFilters() {
  const fechaInicioInput = document.getElementById('appointment-filter-fecha-inicio');
  const fechaFinInput = document.getElementById('appointment-filter-fecha-fin');
  const estadoSelect = document.getElementById('appointment-filter-estado');
  const filtrarBtn = document.getElementById('appointment-filter-btn');
  const limpiarBtn = document.getElementById('appointment-filter-limpiar-btn');
  const appointmentsTableBody = document.getElementById('appointments-table-body');

  if (!filtrarBtn || !appointmentsTableBody) return;

  async function applyFilters() {
    const fechaInicio = fechaInicioInput?.value;
    const fechaFin = fechaFinInput?.value;
    const estado = estadoSelect?.value;

    try {
      const response = await apiGateway({ resource: 'citas', method: 'GET' });
      let citas = response?.data || [];

      if (fechaInicio) citas = citas.filter((c) => c.fecha >= fechaInicio);
      if (fechaFin) citas = citas.filter((c) => c.fecha <= fechaFin);
      if (estado && estado !== 'Todas') citas = citas.filter((c) => c.estado === estado);

      renderFilteredAppointments(citas);
    } catch (error) {
      console.error('Error filtrando citas:', error);
      appointmentsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Error al cargar citas filtradas.</td></tr>';
    }
  }

  function clearFilters() {
    if (fechaInicioInput) fechaInicioInput.value = '';
    if (fechaFinInput) fechaFinInput.value = '';
    if (estadoSelect) estadoSelect.value = 'Todas';
    applyFilters();
  }

  function renderFilteredAppointments(citas) {
    if (!citas || citas.length === 0) {
      appointmentsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No se encontraron citas con los filtros aplicados.</td></tr>';
      return;
    }

    appointmentsTableBody.innerHTML = citas.map((cita) => {
      const paciente = adminDashboardCache.pacientes.find((p) => p.id_paciente === cita.id_paciente_fk);
      const medico = adminDashboardCache.medicos.find((m) => m.id_medico === cita.id_medico_fk);
      return `
        <tr>
          <td>${cita.fecha}</td>
          <td>${cita.hora}</td>
          <td>${paciente ? `${paciente.nombre} ${paciente.primer_apellido}` : 'Paciente no encontrado'}</td>
          <td>${medico?.nombre || 'Médico no asignado'}</td>
          <td>${renderStatusBadge(cita.estado)}</td>
          <td>${cita.observacion || '-'}</td>
        </tr>
      `;
    }).join('');
  }

  filtrarBtn.addEventListener('click', applyFilters);
  limpiarBtn?.addEventListener('click', clearFilters);
  applyFilters();
}

async function renderAdministrativoDashboard() {
  const cards = {
    pacientesCount: document.getElementById('admin-pacientes-count'),
    citasCount: document.getElementById('admin-citas-count'),
    citasHoyCount: document.getElementById('admin-citas-hoy-count'),
    pendientesCount: document.getElementById('admin-pendientes-count'),
  };

  const todayAppointmentsBody = document.getElementById('admin-today-appointments-body');
  const latestPatientsList = document.getElementById('admin-latest-patients-list');

  try {
    const [pacientesResp, citasResp, medicosResp] = await Promise.all([
      apiGateway({ resource: 'pacientes', method: 'GET' }),
      apiGateway({ resource: 'citas', method: 'GET' }),
      apiGateway({ resource: 'medicos', method: 'GET' }),
    ]);

    const pacientes = pacientesResp?.data || [];
    const citas = citasResp?.data || [];
    const medicos = medicosResp?.data || [];
    adminDashboardCache.pacientes = pacientes;
    adminDashboardCache.citas = citas;
    adminDashboardCache.medicos = medicos;

    const today = new Date().toISOString().split('T')[0];
    const citasHoy = citas.filter((c) => c.fecha === today);
    const citasPendientes = citas.filter((c) => c.estado === 'Agendada');
    const latestPatients = [...pacientes].sort((a, b) => b.id_paciente - a.id_paciente).slice(0, 5);

    if (cards.pacientesCount) cards.pacientesCount.textContent = pacientes.length;
    if (cards.citasCount) cards.citasCount.textContent = citas.length;
    if (cards.citasHoyCount) cards.citasHoyCount.textContent = citasHoy.length;
    if (cards.pendientesCount) cards.pendientesCount.textContent = citasPendientes.length;

    if (latestPatientsList) {
      latestPatientsList.innerHTML = latestPatients.length
        ? latestPatients.map((p) => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>${p.nombre} ${p.primer_apellido}</strong>
                <div class="text-muted small">${p.numero_identificacion}</div>
              </div>
              <span class="badge bg-primary rounded-pill">ID ${p.id_paciente}</span>
            </li>
          `).join('')
        : '<li class="list-group-item text-muted">No hay pacientes registrados aún.</li>';
    }

    renderAdminCitasHoy();
    updateAdminCitasHoyHeaderBadge(currentAdminAppointmentFilter);
  } catch (error) {
    console.warn('No se pudo cargar el dashboard administrativo:', error);
    if (todayAppointmentsBody) {
      todayAppointmentsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Error cargando citas.</td></tr>';
    }
    if (latestPatientsList) {
      latestPatientsList.innerHTML = '<li class="list-group-item text-muted">No se pudo cargar la lista de pacientes.</li>';
    }
  }
}

function registerAdministrativoQuickActions() {
  const navigateToSection = (sectionId) => {
    document.querySelector(`.sidebar-item[data-section="${sectionId}"]`)?.click();
  };

  document.getElementById('admin-action-new-patient')?.addEventListener('click', () => navigateToSection('patients'));
  document.getElementById('admin-action-new-cita')?.addEventListener('click', () => navigateToSection('appointments'));
  document.getElementById('admin-action-view-appointments')?.addEventListener('click', () => navigateToSection('appointments'));
}

function registerAdminDashboardFilterButtons() {
  const filterButtons = Array.from(document.querySelectorAll('#admin-today-filter-buttons button[data-status]'));
  if (!filterButtons.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedStatus = button.dataset.status || 'todas';
      setAdminDashboardFilter(selectedStatus);
    });
  });
}

function setAdminDashboardFilter(status) {
  currentAdminAppointmentFilter = status;
  updateAdminFilterButtons(status);
  updateAdminCitasHoyStatusBadge(status);
  updateAdminCitasHoyHeaderBadge(status);
  renderAdminCitasHoy();
}

function updateAdminFilterButtons(status) {
  document.querySelectorAll('#admin-today-filter-buttons button[data-status]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
}

function updateAdminCitasHoyStatusBadge(status) {
  const badge = document.getElementById('admin-citas-hoy-status-badge');
  if (!badge) return;
  const normalized = status === 'todas' ? 'Todas' : status;
  badge.textContent = normalized;
  badge.className = `badge ms-2 ${
    status === 'todas' ? 'bg-secondary'
    : status === 'Agendada' ? 'bg-primary'
    : status === 'Atendida' ? 'bg-success'
    : status === 'Cancelada' ? 'bg-danger'
    : 'bg-secondary'
  }`;
}

function updateAdminCitasHoyHeaderBadge(status) {
  const badge = document.getElementById('admin-citas-hoy-filter-badge');
  if (!badge) return;

  const today = new Date().toISOString().split('T')[0];
  const citasHoy = adminDashboardCache.citas.filter((c) => c.fecha === today);
  const filteredCitas = status === 'todas' ? citasHoy : citasHoy.filter((c) => c.estado === status);

  if (status === 'todas') {
    badge.className = 'badge bg-secondary ms-2';
    badge.textContent = `Total ${filteredCitas.length}`;
    badge.style.cursor = 'default';
    badge.onclick = null;
  } else {
    const badgeClass = status === 'Agendada' ? 'bg-primary' : status === 'Atendida' ? 'bg-success' : status === 'Cancelada' ? 'bg-danger' : 'bg-secondary';
    badge.className = `badge ${badgeClass} ms-2`;
    badge.innerHTML = `${status} <span style="cursor:pointer; margin-left:0.35rem;">&times;</span>`;
    badge.style.cursor = 'pointer';
    badge.onclick = () => setAdminDashboardFilter('todas');
  }
}

function renderAdminCitasHoy() {
  const todayAppointmentsBody = document.getElementById('admin-today-appointments-body');
  const today = new Date().toISOString().split('T')[0];
  const citasHoy = adminDashboardCache.citas.filter((c) => c.fecha === today);
  const filteredCitas = currentAdminAppointmentFilter === 'todas'
    ? citasHoy
    : citasHoy.filter((c) => c.estado === currentAdminAppointmentFilter);

  if (!todayAppointmentsBody) return;

  todayAppointmentsBody.innerHTML = filteredCitas.length
    ? filteredCitas.map((cita) => {
        const paciente = adminDashboardCache.pacientes.find((p) => p.id_paciente === cita.id_paciente_fk);
        const medico = adminDashboardCache.medicos.find((m) => m.id_medico === cita.id_medico_fk);
        return `
          <tr>
            <td>${cita.hora || '-'}</td>
            <td>${paciente ? `${paciente.nombre} ${paciente.primer_apellido}` : 'Paciente no encontrado'}</td>
            <td>${medico?.nombre || 'Médico no asignado'}</td>
            <td>${renderStatusBadge(cita.estado)}</td>
            <td>${cita.observacion || '-'}</td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="5" class="text-center text-muted py-4">No hay citas para el estado seleccionado.</td></tr>';
}

function renderStatusBadge(status) {
  const normalized = status || 'Desconocido';
  const badgeClass = normalized === 'Agendada' ? 'bg-primary'
    : normalized === 'Atendida' ? 'bg-success'
    : normalized === 'Cancelada' ? 'bg-danger'
    : 'bg-secondary';
  return `<span class="badge ${badgeClass}">${normalized}</span>`;
}

function registerConsultationModal() {
  const btn = document.getElementById('new-consultation-btn');
  const modalEl = document.getElementById('consultationModal');
  if (!btn || !modalEl) return;

  btn.addEventListener('click', () => {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  });
}

function registerTimelineButtons() {
  const newConsultationBtn = document.getElementById('new-consultation-btn');
  if (!newConsultationBtn) return;
  newConsultationBtn.addEventListener('click', () => {
    const modalEl = document.getElementById('consultationModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  });
}