# Endpoints REST (compatibles con frontend/mock)

Sistema: **gestor de citas médicas**.

> Nota de compatibilidad: los endpoints listados primero están diseñados para ser **1:1** con el contrato observado en `src/api/mockApi.js` y llamadas del frontend (vía `apiGateway`).

## Convenciones de respuesta

- Cuando el mock usa `apiRequest`, el frontend espera típicamente **JSON con forma** `response.data`.
- Para backend real, mantén respuestas consistentes:
  - Puede devolverse `{ data: ... }`.
  - En el frontend se desenvuelve `data?.data` si existe.

Ejemplo esperado (general):
```json
{ "data": { } }
```

Para listados:
```json
{ "data": [ ... ] }
```

---

## 1) Autenticación y usuarios (módulo auth)

### 1.1 Login
- **POST** `/auth/login`
- **Propósito:** iniciar sesión.
- **Request body esperado:**
```json
{
  "usuario": "string",
  "contrasena": "string"
}
```
- **Response JSON esperado:**
```json
{
  "data": {
    "token": "string",
    "user": {
      "id_usuario": 1,
      "usuario": "admin",
      "rol": "Administrativo",
      "nombre": "string",
      "id_medico_fk": 2
    }
  }
}
```

### 1.2 Perfil del usuario autenticado
- **GET** `/auth/me`
- **Propósito:** obtener información del usuario autenticado.
- **Request body:** ninguno
- **Response JSON esperado:**
```json
{
  "data": {
    "id_usuario": 1,
    "usuario": "admin",
    "rol": "Administrativo"
  }
}
```

### 1.3 Listado de usuarios (dashboards admins)
- **GET** `/auth/usuarios`
- **Propósito:** listar usuarios del sistema (para conteos por estado y administración).
- **Request body:** ninguno
- **Response JSON esperado:**
```json
{
  "data": [
    {
      "id_usuario": 1,
      "usuario": "string",
      "rol": "Médico | Administrativo | Administrador",
      "nombre": "string",
      "status": "Activo | Inactivo",
      "id_medico_fk": 2
    }
  ]
}
```

### 1.4 Obtener usuario por id
- **GET** `/auth/usuarios/{id_usuario}`
- **Propósito:** obtener usuario específico.
- **Response JSON esperado:**
```json
{ "data": { "id_usuario": 1, "status": "Activo", "rol": "string" } }
```

### 1.5 Crear usuario
- **POST** `/auth/usuarios`
- **Propósito:** crear usuario (admin/administrativo/médico).
- **Request body esperado:**
```json
{
  "id_usuario": null,
  "usuario": "string",
  "contrasena": "string",
  "rol": "Médico | Administrativo | Administrador",
  "status": "Activo | Inactivo",
  "nombre": "string",
  "id_medico_fk": 2
}
```
- **Response JSON esperado:**
```json
{ "data": { "id_usuario": 1, "rol": "string" } }
```

### 1.6 Actualizar usuario
- **PUT** `/auth/usuarios/{id_usuario}`
- **Propósito:** actualizar usuario.
- **Request body esperado:** (parcial o completo según backend)
```json
{
  "usuario": "string",
  "contrasena": "string",
  "rol": "...",
  "status": "Activo | Inactivo",
  "nombre": "string",
  "id_medico_fk": 2
}
```
- **Response JSON esperado:**
```json
{ "data": { "id_usuario": 1, "status": "Activo" } }
```

### 1.7 Cambiar estado (PATCH - acorde a frontend)
- **PATCH** `/auth/usuarios/{id_usuario}/estado`
- **Propósito:** activar/inactivar usuario.
- **Request body esperado:**
```json
{ "estado": "Activo | Inactivo" }
```
- **Response JSON esperado:**
```json
{ "data": { "id_usuario": 1, "status": "Inactivo" } }
```

---

## 2) Catálogos (catálogos / opciones)

### 2.1 EPS
- **GET** `/eps`
- **Propósito:** listar EPS.
- **Response JSON esperado:**
```json
{ "data": [ { "id_eps": 1, "nombre": "Sura" } ] }
```

### 2.2 Regímenes
- **GET** `/regimenes`
- **Propósito:** listar regímenes.
- **Response:**
```json
{ "data": [ { "id_regimen": 1, "nombre": "Contributivo" } ] }
```

### 2.3 Especialidades
- **GET** `/especialidades`
- **Propósito:** listar especialidades.
- **Response:**
```json
{ "data": [ { "id_especialidad": 1, "nombre": "Cardiología" } ] }
```

### 2.4 Servicios
- **GET** `/servicios`
- **Propósito:** listar servicios.
- **Response:**
```json
{ "data": [ { "id_servicio": 1, "nombre": "Laboratorio" } ] }
```

### 2.5 Horarios (por médico si aplica)
- **GET** `/horarios`
- **Propósito:** listar horarios.
- **Filtros (query):**
  - `medico_id` (opcional)
- **Response JSON esperado:**
```json
{ "data": [ { "id_horario": 1, "id_medico_fk": 2, "dia": "Lunes" } ] }
```

### 2.6 Estados de cita
- **GET** `/estados`
- **Propósito:** listar estados posibles.
- **Response:**
```json
{ "data": [ { "id": 1, "nombre": "Pendiente" } ] }
```

---

## 3) Pacientes (módulo pacientes)

### 3.1 Listar / buscar pacientes
- **GET** `/pacientes`
- **Propósito:** listar pacientes o buscar por query.
- **Query params esperados (observado en frontend/mock):**
  - `query` (string; por número de identificación o nombre completo)
- **Response JSON esperado:**
```json
{ "data": [
  {
    "id_paciente": 1,
    "numero_identificacion": "1020304050",
    "nombre": "María",
    "primer_apellido": "González",
    "segundo_apellido": "López",
    "fecha_de_nacimiento": "1985-03-15",
    "direccion": "string",
    "id_eps_fk": 1,
    "id_regimen_fk": 1,
    "sexo": "F | M",
    "tipo_sangre": "O+",
    "alergias": ["string"],
    "antecedentes": "string",
    "contactos": [ { "tipo": "celular|email", "dato_contacto": "string" } ]
  }
]}
```

### 3.2 Crear paciente
- **POST** `/pacientes`
- **Propósito:** crear paciente.
- **Request body esperado:**
```json
{
  "numero_identificacion": "string",
  "nombre": "string",
  "primer_apellido": "string",
  "segundo_apellido": "string",
  "fecha_de_nacimiento": "YYYY-MM-DD",
  "direccion": "string",
  "id_eps_fk": 1,
  "id_regimen_fk": 1,
  "sexo": "F | M",
  "tipo_sangre": "string",
  "alergias": ["string"],
  "antecedentes": "string",
  "contactos": [ { "tipo": "string", "dato_contacto": "string" } ]
}
```
- **Response:** `{ "data": <paciente_creado> }`

### 3.3 Obtener paciente por id
- **GET** `/pacientes/{id_paciente}`
- **Propósito:** obtener paciente.
- **Response:** `{"data": <paciente|null>}`

### 3.4 Actualizar paciente
- **PUT** `/pacientes/{id_paciente}`
- **Propósito:** actualizar paciente.
- **Request body esperado:** estructura similar a creación.
- **Response:** `{"data": <paciente_actualizado|null>}`

---

## 4) Médicos (módulo medico)

### 4.1 Listar / buscar médicos
- **GET** `/medicos`
- **Propósito:** listar médicos o buscar por `query`.
- **Query params:**
  - `query` (string)
- **Response JSON esperado:**
```json
{ "data": [
  {
    "id_medico": 2,
    "nombre": "string",
    "especialidad": "string",
    "primer_apellido": "...",
    "segundo_apellido": "..."
  }
]}
```

### 4.2 Crear médico
- **POST** `/medicos`
- **Propósito:** crear médico.
- **Request body esperado (mock):**
```json
{ "nombre": "string", "especialidad": "string", "id_especialidad_fk": 1 }
```
- **Response:** `{"data": <medico_creado>}`

### 4.3 Actualizar médico
- **PUT** `/medicos/{id_medico}`
- **Propósito:** actualizar médico.
- **Request body:** similar a creación.
- **Response:** `{"data": <medico_actualizado|null>}`

---

## 5) Citas (módulo citas/agenda)

### 5.1 Listar citas (con filtros vía query)
- **GET** `/citas`
- **Propósito:** listar citas (para agenda, panel médico y administrativo).
- **Query params (observado mock):**
  - `medicoId` (number)
  - `pacienteId` (number)
  - `estado` (string; “Todas” o vacío significa sin filtro)
  - (Recomendado) `desde`, `hasta` para rango de fechas
- **Response JSON esperado:**
```json
{ "data": [
  {
    "id_cita": 1,
    "fecha": "YYYY-MM-DD",
    "hora": "HH:mm",
    "estado": "Agendada|Atendida|Cancelada|No asistió",
    "id_paciente_fk": 1,
    "id_medico_fk": 2,
    "id_horario_medico_fk": 1,
    "observacion": "string"
  }
]}
```

> Compatibilidad: el frontend también normaliza nombres como `fecha_cita`, `hora_cita`, `observaciones/observacion` según su UI. Backend puede devolver el formato mock y el frontend lo normaliza.

### 5.2 Crear cita
- **POST** `/citas`
- **Propósito:** agendar una cita.
- **Request body esperado:**
```json
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "id_paciente_fk": 1,
  "id_medico_fk": 2,
  "id_horario_medico_fk": 1,
  "observacion": "string"
}
```
- **Response:** `{"data": <cita_creada>}`

### 5.3 Obtener cita por id
- **GET** `/citas/{id_cita}`
- **Propósito:** obtener cita.
- **Response:** `{"data": <cita|null>}`

### 5.4 Actualizar cita
- **PUT** `/citas/{id_cita}`
- **Propósito:** actualizar cita (estado, observación, etc.).
- **Request body esperado:**
```json
{
  "estado": "Agendada|Atendida|Cancelada|No asistió",
  "observacion": "string",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm"
}
```
- **Response:** `{"data": <cita_actualizada|null>}`

### 5.5 Cancelar cita (operación de estado)
- **PUT** `/citas/{id_cita}/cancelar`
- **Propósito:** cancelar cita.
- **Request body esperado:**
```json
{ "motivo": "string" }
```
- **Response:** `{"data": <cita_cancelada>}`

---

## 6) Consultas (módulo consultas/historia clínica)

### 6.1 Listar consultas (por historia clínica)
- **GET** `/consultas`
- **Propósito:** listar consultas filtradas.
- **Query params (mock):**
  - `id_historia_clinica_fk` (number)
- **Response:**
```json
{ "data": [
  {
    "id_consulta": 1,
    "id_cita_fk": 1,
    "id_historia_clinica_fk": 1,
    "diagnostico": "string",
    "observacion": "string",
    "fecha_consulta": "YYYY-MM-DD",
    "servicios_ids": [1,2]
  }
]}
```

### 6.2 Crear consulta (desde una cita)
- **POST** `/consultas`
- **Propósito:** registrar una consulta asociada a una historia clínica y (opcionalmente) a una cita.
- **Request body esperado:**
```json
{
  "id_cita_fk": 1,
  "id_historia_clinica_fk": 1,
  "diagnostico": "string",
  "observacion": "string",
  "servicios_ids": [1,5]
}
```
- **Response:** `{"data": <consulta_creada>}`

> Compatibilidad: el mock además cambia el estado de la cita a “Atendida” cuando `id_cita_fk` existe.

---

## 7) Historial clínico (Historias clínicas)

### 7.1 Obtener historias clínicas
- **GET** `/historias_clinicas`
- **Propósito:** listar historias clínicas.
- **Query params (mock):**
  - `pacienteId` (number) 
  - `id_paciente_fk` (number)
- **Response:**
```json
{ "data": [
  {
    "id_historia_clinica": 1,
    "id_paciente_fk": 1,
    "resumen": "string",
    "fecha_apertura": "YYYY-MM-DD"
  }
]}
```

### 7.2 Crear historia clínica
- **POST** `/historias_clinicas`
- **Propósito:** crear historia clínica (append inicial).
- **Request body esperado:**
```json
{
  "id_paciente_fk": 1,
  "resumen": "string",
  "fecha_apertura": "YYYY-MM-DD"
}
```
- **Response:** `{"data": <historia_creada>}`

---

## 8) Signos vitales

### 8.1 Registrar signos vitales (por consulta)
- **POST** `/signos_vitales`
- **Propósito:** crear registro de signos vitales para una consulta.
- **Request body esperado:**
```json
{
  "id_consulta_fk": 1,
  "peso": 70.5,
  "estatura": 175,
  "temperatura": 36.6,
  "presion_arterial": "120/80",
  "frecuencia_cardiaca": 80,
  "saturacion_oxigeno": 98,
  "fecha_registro": "ISO-8601"
}
```
- **Response:** `{"data": <signos_vitales_creados>}`

### 8.2 Listar signos vitales por consulta
- **GET** `/signos_vitales`
- **Propósito:** obtener signos vitales.
- **Query params (mock):**
  - `id_consulta_fk` (number)
- **Response:**
```json
{ "data": [ { "id_signos_vitales": 1, "id_consulta_fk": 1, "peso": 70.5 } ] }
```

---

## 9) Endpoints REST recomendados (dashboards, filtros, relaciones)

Estos NO aparecen en el mock como endpoints dedicados, pero son REST “buenos” y te ayudan a backend real.

### 9.1 Dashboard administrativo: usuarios por estado
- **GET** `/dashboard/admin/users/count?estado=Activo|Inactivo`
- **Propósito:** conteo por estado.
- **Response:**
```json
{ "data": { "estado": "Activo", "count": 12 } }
```

> Para compatibilidad, el frontend actualmente usa `GET /auth/usuarios` y calcula el conteo en cliente. Puedes implementar este endpoint y (si luego modificas frontend) consumirlo.

### 9.2 Dashboard administrativo: resumen general
- **GET** `/dashboard/admin/summary`
- **Response:**
```json
{ "data": {
  "usuarios": { "Activo": 10, "Inactivo": 3 },
  "pacientes_count": 50,
  "citas_hoy_count": 14
}}
```

### 9.3 Dashboard médico: citas del día
- **GET** `/dashboard/medico/{id_medico}/citas?fecha=YYYY-MM-DD`
- **Response:**
```json
{ "data": [ { "id_cita": 1, "hora": "09:00", "estado": "Agendada" } ] }
```

> En el frontend actual el médico filtra desde `GET /citas`.

### 9.4 Relaciones “expand” (p.ej. citas con paciente y médico)
- **GET** `/citas?expand=paciente,medico&estado=Agendada`
- **Propósito:** evitar N+1 desde backend.
- **Response:**
```json
{ "data": [ { "id_cita": 1, "paciente": {"id_paciente":1}, "medico": {"id_medico":2} } ] }
```

---

## 10) Notas de diseño REST (para backend real)

- Operaciones de estado (ej. cancelar) deben ser rutas claras o usar PATCH con comando. Aquí se preserva compatibilidad con el mock: `/citas/{id}/cancelar`.
- Para filtros, usa `query params` en endpoints listados (`/citas`, `/pacientes`, `/historias_clinicas`, `/consultas`).
- Mantén campos del mock (snake_case como `id_paciente_fk`, `observacion`) para máxima compatibilidad; el frontend hace normalización en algunos módulos.

