# TODO (Medico: historia clínica + signos vitales)

## Pendiente
- [x] Crear plan de edición confirmado (frontend) para medicoModuleV2.js + medicoService.js + mockApi.js.
- [ ] Implementar en `medicoService.js` funciones:
  - [ ] `getHistoriaClinicaByPaciente(pacienteId)`
  - [ ] `createHistoriaClinica({ id_paciente_fk, resumen? })`
  - [ ] `registrarSignosVitalesPorConsulta({ id_consulta_fk, ...signos })`
- [ ] Implementar en `src/api/mockApi.js` nuevos recursos/endpoints mock:
  - [ ] `historias_clinicas` GET por paciente y POST creación
  - [ ] `signos_vitales` POST para guardar por consulta (append)
- [ ] Actualizar `medicoModuleV2.js`:
  - [ ] Obtener `id_paciente_fk` desde la cita
  - [ ] Si no hay historia, crearla y usar `id_historia_clinica_fk`
  - [ ] Guardar consulta
  - [ ] Capturar signos vitales del formulario y persistirlos ligados a `id_consulta`
  - [ ] Reset de UI de signos vitales al abrir modal sin tocar historial
- [ ] Verificar que el payload/contrato quede listo para backend real:
  - [ ] `consultas`: id_cita_fk, id_historia_clinica_fk, diagnostico, observacion, servicios_ids
  - [ ] `signos_vitales`: id_consulta_fk + peso/estatura/temperatura/presión/frecuencia/saturación


