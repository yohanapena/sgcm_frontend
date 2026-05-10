import { searchPacientes, createPaciente } from '../pacientes/pacientesService.js';
import { createCita } from '../citas/citasService.js';
import { magicLoop } from '../../api/magicLoops.js';

const users = [
  { id: 1, username: 'admin1', role: 'Administrativo', status: 'Activo', doctorId: null },
  { id: 2, username: 'medico1', role: 'Medico', status: 'Activo', doctorId: 1 },
];

export function mountAdminModule() {
  registerPatientForm();
  registerAppointmentWizard();
  registerConsultationModal();
  registerTimelineButtons();
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
      if (response?.data) {
        form.reset();
        alert('Paciente creado correctamente');
      } else {
        alert('Error al crear el paciente');
      }
    } catch (error) {
      console.error('Error creando paciente:', error);
      alert('Error al crear el paciente: ' + error.message);
    }
  });
}

function registerAppointmentWizard() {
  const wizardNav = Array.from(document.querySelectorAll('.wizard-nav-item'));
  const wizardSteps = Array.from(document.querySelectorAll('.wizard-step'));
  const patientSearchInput = document.getElementById('appointment-patient-search');
  const patientSearchBtn = document.getElementById('appointment-search-patient-btn');
  const patientResultsBody = document.getElementById('appointment-patient-results');
  const specialtyCards = Array.from(document.querySelectorAll('.specialty-card'));
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

  let currentStep = 0;
  const appointmentState = {
    paciente: null,
    especialidad: null,
    medico: null,
    fecha: null,
    hora: null,
  };

  if (wizardNav.length === 0 || wizardSteps.length === 0) return;

  function goToStep(index) {
    wizardNav.forEach((item, idx) => {
      item.classList.toggle('active', idx === index);
      item.classList.toggle('completed', idx < index);
    });
    wizardSteps.forEach((step, idx) => step.classList.toggle('active', idx === index));
    currentStep = index;
    if (index === 4) {
      renderConfirmation();
    }
  }

  async function searchPacientes() {
    const query = patientSearchInput?.value.trim();
    if (!query) {
      alert('Ingrese un documento o nombre de paciente');
      return;
    }

    try {
      const response = await searchPacientes(query);
      const pacientes = response?.data || [];
      renderPatientResults(pacientes);
    } catch (error) {
      console.error('Error buscando pacientes:', error);
      alert('Error al buscar pacientes');
    }
  }

  function renderPatientResults(pacientes) {
    if (!patientResultsBody) return;

    if (!pacientes || pacientes.length === 0) {
      patientResultsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No se encontraron pacientes.</td></tr>';
      return;
    }

    patientResultsBody.innerHTML = pacientes
      .map((paciente) => `
        <tr>
          <td>${paciente.numero_identificacion}</td>
          <td>${paciente.nombre}</td>
          <td>${paciente.primer_apellido} ${paciente.segundo_apellido || ''}</td>
          <td>${paciente.id_eps_fk || 'No registrado'}</td>
          <td>
            <button type="button" class="btn btn-sm btn-primary select-patient-btn" data-id="${paciente.id_paciente}">Seleccionar</button>
          </td>
        </tr>
      `)
      .join('');

    patientResultsBody.querySelectorAll('.select-patient-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        const pacienteId = Number(event.target.dataset.id);
        const paciente = pacientes.find((item) => item.id_paciente === pacienteId);
        if (paciente) {
          appointmentState.paciente = paciente;
          goToStep(1);
          highlightSelectedPatientRow(pacienteId);
        }
      });
    });
  }

  function highlightSelectedPatientRow(id) {
    patientResultsBody.querySelectorAll('tr').forEach((row) => {
      row.classList.toggle('table-success', row.querySelector('.select-patient-btn')?.dataset.id == id);
    });
  }

  async function loadDoctors(especialidad) {
    if (!doctorContainer) return;
    const result = await magicLoop({ resource: 'medicos', method: 'GET' });
    const medicos = (result?.data || []).filter((medico) => medico.especialidad === especialidad);

    if (medicos.length === 0) {
      doctorContainer.innerHTML = '<div class="col-12 text-muted">No hay médicos disponibles para esta especialidad.</div>';
      return;
    }

    doctorContainer.innerHTML = medicos
      .map((medico) => `
        <div class="col-md-4 mb-3">
          <div class="card doctor-card h-100" data-id="${medico.id_medico}" data-nombre="${medico.nombre}">
            <div class="card-body text-center">
              <img src="https://cdn.pixabay.com/photo/2017/01/31/22/32/doctor-2027768_960_720.png" alt="Doctor" class="img-fluid rounded-circle mb-3" style="width: 100px; height: 100px; object-fit: cover;">
              <h5>${medico.nombre}</h5>
              <p class="text-muted">${medico.especialidad}</p>
            </div>
          </div>
        </div>
      `)
      .join('');

    doctorContainer.querySelectorAll('.doctor-card').forEach((card) => {
      card.addEventListener('click', () => {
        const medicoId = Number(card.dataset.id);
        const medicoNombre = card.dataset.nombre;
        appointmentState.medico = { id_medico: medicoId, nombre: medicoNombre };
        doctorContainer.querySelectorAll('.doctor-card').forEach((item) => item.classList.toggle('border-primary', item === card));
      });
    });
  }

  function renderConfirmation() {
    if (!appointmentState.paciente || !appointmentState.medico || !appointmentState.especialidad || !appointmentState.hora) {
      alert('Debe completar todos los pasos antes de confirmar la cita.');
      return;
    }

    if (confirmPatient) confirmPatient.textContent = `${appointmentState.paciente.nombre} ${appointmentState.paciente.primer_apellido}`;
    if (confirmIdentificacion) confirmIdentificacion.textContent = appointmentState.paciente.numero_identificacion;
    if (confirmEps) confirmEps.textContent = appointmentState.paciente.id_eps_fk || 'No registrado';
    if (confirmMedico) confirmMedico.textContent = appointmentState.medico.nombre;
    if (confirmEspecialidad) confirmEspecialidad.textContent = appointmentState.especialidad;
    if (confirmFechaHora) confirmFechaHora.textContent = `${appointmentState.fecha || 'Hoy'} - ${appointmentState.hora}`;
  }

  function resetWizard() {
    if (patientSearchInput) patientSearchInput.value = '';
    if (patientResultsBody) patientResultsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Busca un paciente para seleccionar</td></tr>';
    appointmentState.paciente = null;
    appointmentState.especialidad = null;
    appointmentState.medico = null;
    appointmentState.fecha = null;
    appointmentState.hora = null;
    if (observationsInput) observationsInput.value = '';
    if (doctorContainer) doctorContainer.innerHTML = '<div class="col-12"><p class="text-muted">Selecciona una especialidad primero para ver los médicos disponibles.</p></div>';
    if (scheduleContainer) { scheduleContainer.querySelectorAll('.schedule-slot').forEach((slot) => slot.classList.remove('selected')); }
    goToStep(0);
  }

  wizardNav.forEach((navItem, idx) => {
    navItem.addEventListener('click', () => {
      goToStep(idx);
    });
  });

  step1Next?.addEventListener('click', () => {
    if (!appointmentState.paciente) {
      alert('Selecciona un paciente antes de continuar.');
      return;
    }
    goToStep(1);
  });

  specialtyCards.forEach((card) => {
    card.addEventListener('click', () => {
      specialtyCards.forEach((item) => item.classList.remove('border-primary'));
      card.classList.add('border-primary');
      appointmentState.especialidad = card.dataset.specialty;
      appointmentState.medico = null;
      loadDoctors(appointmentState.especialidad);
    });
  });

  step2Prev?.addEventListener('click', () => goToStep(0));
  step2Next?.addEventListener('click', () => {
    if (!appointmentState.especialidad) {
      alert('Selecciona una especialidad antes de continuar.');
      return;
    }
    goToStep(2);
  });

  step3Prev?.addEventListener('click', () => goToStep(1));
  step3Next?.addEventListener('click', () => {
    if (!appointmentState.medico) {
      alert('Selecciona un médico antes de continuar.');
      return;
    }
    goToStep(3);
  });

  scheduleContainer?.querySelectorAll('.schedule-slot').forEach((slot) => {
    slot.addEventListener('click', () => {
      if (slot.classList.contains('unavailable')) return;
      scheduleContainer.querySelectorAll('.schedule-slot').forEach((item) => item.classList.remove('selected'));
      slot.classList.add('selected');
      appointmentState.hora = slot.dataset.hora;
      appointmentState.fecha = 'Hoy';
    });
  });

  step4Prev?.addEventListener('click', () => goToStep(2));
  step4Next?.addEventListener('click', () => {
    if (!appointmentState.hora) {
      alert('Selecciona un horario antes de continuar.');
      return;
    }
    goToStep(4);
  });

  step5Prev?.addEventListener('click', () => goToStep(3));

  appointmentConfirmBtn?.addEventListener('click', async () => {
    if (!appointmentState.paciente || !appointmentState.medico || !appointmentState.especialidad || !appointmentState.hora) {
      alert('Falta información para confirmar la cita.');
      return;
    }

    const payload = {
      fecha: new Date().toISOString().split('T')[0],
      hora: appointmentState.hora,
      id_paciente_fk: appointmentState.paciente.id_paciente,
      id_medico_fk: appointmentState.medico.id_medico,
      observacion: observationsInput?.value.trim() || 'Cita agendada desde módulo administrativo',
    };

    try {
      const response = await createCita(payload);
      if (response?.data) {
        alert('✅ Cita creada correctamente');
        resetWizard();
      } else {
        alert('Error al crear la cita');
      }
    } catch (error) {
      console.error('Error creando cita:', error);
      alert('Error al crear la cita: ' + error.message);
    }
  });

  patientSearchBtn?.addEventListener('click', searchPacientes);
  patientSearchInput?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchPacientes();
    }
  });
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
