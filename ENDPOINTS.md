# Contratos API — SGCM v2 (corregidos y definitivos)

> Documento generado tras auditoría del DDL v3 + ENDPOINTS.md original.
> Este es el contrato único de verdad. Reemplaza el ENDPOINTS.md anterior.
> 
> **Convención de respuesta:** toda respuesta exitosa tiene la forma `{ "data": ... }`.  
> **Autenticación:** todos los endpoints excepto `/auth/login` requieren `Authorization: Bearer {token}`.  
> **Snake_case:** todos los campos siguen el naming del DDL exactamente.

---

## 1. Auth — Andrea

### POST `/auth/login`
```json
// Request
{ "usuario": "string", "contrasena": "string" }

// Response 200
{
  "data": {
    "token": "string",
    "user": {
      "id_usuario": 1,
      "usuario": "admin",
      "rol": "Administrativo",
      "estado": "Activo",
      "id_medico_fk": null
    }
  }
}
```

### GET `/auth/me`
```json
// Response 200
{
  "data": {
    "id_usuario": 1,
    "usuario": "admin",
    "rol": "Administrativo",
    "estado": "Activo",
    "id_medico_fk": null
  }
}
```

---

## 2. Usuarios — Andrea
> ⚠️ Cambiado: rutas movidas de /auth/usuarios → /usuarios (módulo separado)

### GET `/usuarios`
```json
// Response 200
{
  "data": [
    {
      "id_usuario": 1,
      "usuario": "string",
      "rol": "Administrativo",
      "estado": "Activo",
      "fecha_creacion": "2026-01-01T00:00:00",
      "id_medico_fk": null,
      "medico_nombre": "string"
    }
  ]
}
```
> `medico_nombre` viene de JOIN con medicos (nombre + primer_apellido). NULL si rol=Administrativo.

### GET `/usuarios/{id_usuario}`
```json
// Response 200
{
  "data": {
    "id_usuario": 1,
    "usuario": "string",
    "rol": "Administrativo",
    "estado": "Activo",
    "fecha_creacion": "2026-01-01T00:00:00",
    "id_medico_fk": null,
    "medico_nombre": null
  }
}
```

### POST `/usuarios`
```json
// Request
{
  "usuario": "string",
  "contrasena": "string",
  "rol": "Administrativo | Medico",
  "id_medico_fk": null
}
// ⚠️ rol solo puede ser 'Administrativo' o 'Medico' (ENUM del DDL)
// ⚠️ si rol=Medico, id_medico_fk es obligatorio

// Response 201
{ "data": { "id_usuario": 1, "usuario": "string", "rol": "Medico", "estado": "Activo" } }
```

### PUT `/usuarios/{id_usuario}`
```json
// Request (campos opcionales, enviar solo los que cambian)
{
  "usuario": "string",
  "contrasena": "string",
  "rol": "Administrativo | Medico",
  "id_medico_fk": null
}

// Response 200
{ "data": { "id_usuario": 1, "estado": "Activo" } }
```

### PATCH `/usuarios/{id_usuario}/estado`
```json
// Request
{ "estado": "Activo | Inactivo" }

// Response 200
{ "data": { "id_usuario": 1, "estado": "Inactivo" } }
```

---

## 3. Catálogos — Vanesa
> Solo lectura. No hay POST/PUT/DELETE en catálogos.

### GET `/eps`
```json
// Response 200
{ "data": [ { "id_eps": 1, "nit_eps": "900123456", "nombre_eps": "Sura" } ] }
```

### GET `/regimenes`
```json
// Response 200
{ "data": [ { "id_regimen": 1, "tipo_regimen": "Contributivo" } ] }
```

### GET `/especialidades`
```json
// Response 200
{ "data": [ { "id_especialidad": 1, "nombre_especialidad": "Medicina General", "descripcion": "string" } ] }
```
> ⚠️ Campo es `nombre_especialidad`, no `nombre`. Ajustar frontend.

### GET `/servicios`
```json
// Response 200
{ "data": [ { "id_servicio": 1, "nombre": "Laboratorio", "descripcion": "string" } ] }
```

> ⚠️ ELIMINADO: `GET /estados` — los estados son ENUM hardcodeado en el frontend:
> `['Agendada', 'Cancelada', 'Atendida']`

---

## 4. Pacientes — Vanesa

### GET `/pacientes?query={string}`
```json
// Response 200
{
  "data": [
    {
      "id_paciente": 1,
      "numero_identificacion": "1020304050",
      "nombre": "María",
      "primer_apellido": "González",
      "segundo_apellido": "López",
      "fecha_de_nacimiento": "1985-03-15",
      "direccion": "string",
      "id_eps_fk": 1,
      "nombre_eps": "Sura",
      "id_regimen_fk": 1,
      "tipo_regimen": "Contributivo",
      "sexo": "F",
      "tipo_sangre": "O+",
      "contactos": [
        { "id_contacto": 1, "tipo": "celular", "dato_contacto": "3001234567" }
      ],
      "alergias": [
        { "id": 1, "alergia": "Penicilina" }
      ]
    }
  ]
}
```
> `nombre_eps` y `tipo_regimen` vienen de JOIN — evita N+1 en el frontend.  
> `alergias` se incluye en el GET como JOIN con `paciente_alergias` para lectura.  
> ⚠️ `antecedentes` NO va aquí — está en historia clínica.

### GET `/pacientes/{id_paciente}`
```json
// Response 200 — misma estructura que el objeto del listado
// Response 404
{ "detail": "Paciente no encontrado" }
```

### POST `/pacientes`
```json
// Request
{
  "numero_identificacion": "string",
  "nombre": "string",
  "primer_apellido": "string",
  "segundo_apellido": "string",
  "fecha_de_nacimiento": "YYYY-MM-DD",
  "direccion": "string",
  "id_eps_fk": 1,
  "id_regimen_fk": 1,
  "sexo": "F | M | null",
  "tipo_sangre": "O+ | null",
  "contactos": [
    { "tipo": "celular | fijo | email | whatsapp", "dato_contacto": "string" }
  ]
}
// ⚠️ alergias NO van aquí — tienen endpoints propios
// ⚠️ antecedentes NO van aquí — van en historia clínica

// Response 201
{ "data": { "id_paciente": 1, "numero_identificacion": "string" } }
// Response 409
{ "detail": "El número de identificación ya existe en el sistema" }
```

### PUT `/pacientes/{id_paciente}`
```json
// Request — mismo body que POST excepto numero_identificacion (no se puede cambiar)
// Response 200
{ "data": { "id_paciente": 1, "nombre": "string" } }
```

### GET `/pacientes/{id_paciente}/alergias`
```json
// Response 200
{ "data": [ { "id": 1, "alergia": "Penicilina" } ] }
```

### POST `/pacientes/{id_paciente}/alergias`
```json
// Request
{ "alergia": "string" }

// Response 201
{ "data": { "id": 1, "id_paciente_fk": 1, "alergia": "Penicilina" } }
```

### DELETE `/pacientes/{id_paciente}/alergias/{id_alergia}`
```json
// Response 200
{ "data": { "deleted": true } }
// Response 404
{ "detail": "Alergia no encontrada" }
```

---

## 5. Médicos — Yefferson

### GET `/medicos?query={string}`
```json
// Response 200
{
  "data": [
    {
      "id_medico": 1,
      "nombre": "string",
      "primer_apellido": "string",
      "segundo_apellido": "string",
      "tarjeta_profesional": "string",
      "estado": "Activo",
      "especialidades": [
        { "id_especialidad": 1, "nombre_especialidad": "Medicina General" }
      ]
    }
  ]
}
```
> ⚠️ Cambiado: `especialidades` es array de objetos via JOIN con `especialidades_medicos`.
> Ya no es `"especialidad": "string"`.

### POST `/medicos`
```json
// Request
{
  "nombre": "string",
  "primer_apellido": "string",
  "segundo_apellido": "string",
  "tarjeta_profesional": "string",
  "especialidades": [1, 2]
}
// ⚠️ Cambiado: especialidades es array de IDs, no string
// El repository hace INSERT en especialidades_medicos por cada id

// Response 201
{ "data": { "id_medico": 1, "nombre": "string" } }
```

### PUT `/medicos/{id_medico}`
```json
// Request — mismo body que POST
// Response 200
{ "data": { "id_medico": 1, "estado": "Activo" } }
```

### PATCH `/medicos/{id_medico}/estado`
```json
// Request
{ "estado": "Activo | Inactivo" }
// Response 200
{ "data": { "id_medico": 1, "estado": "Inactivo" } }
```

### GET `/medicos/{id_medico}/horarios`
```json
// Response 200
{
  "data": [
    {
      "id_horario_medico": 1,
      "dia_semana": "Lunes",
      "hora_inicial": "08:00",
      "hora_final": "12:00",
      "fecha_vigencia_inicio": "2026-01-01",
      "fecha_vigencia_fin": null
    }
  ]
}
```

### POST `/medicos/{id_medico}/horarios`
```json
// Request
{
  "dia_semana": "Lunes | Martes | Miércoles | Jueves | Viernes | Sábado",
  "hora_inicial": "08:00",
  "hora_final": "12:00",
  "fecha_vigencia_inicio": "YYYY-MM-DD",
  "fecha_vigencia_fin": "YYYY-MM-DD | null"
}
// Response 201
{ "data": { "id_horario_medico": 1 } }
// Response 409
{ "detail": "El médico ya tiene un horario superpuesto en ese día" }
```

---

## 6. Citas — Yefferson

### GET `/citas`
```json
// Query params opcionales: medico_id, paciente_id, estado, fecha_desde, fecha_hasta
// Response 200
{
  "data": [
    {
      "id_cita": 1,
      "fecha": "YYYY-MM-DD",
      "hora": "HH:MM",
      "estado": "Agendada | Cancelada | Atendida",
      "observacion": "string",
      "fecha_creacion": "ISO-8601",
      "id_paciente_fk": 1,
      "paciente_nombre": "María González",
      "id_horario_medico_fk": 1,
      "medico_nombre": "Dr. Juan Pérez",
      "especialidad_nombre": "Medicina General"
    }
  ]
}
```
> `paciente_nombre`, `medico_nombre`, `especialidad_nombre` vienen de JOINs.
> ⚠️ No hay `id_medico_fk` directo — el médico viene via `horarios_medicos`.

### GET `/citas/{id_cita}`
```json
// Response 200 — mismo objeto del listado
// Response 404
{ "detail": "Cita no encontrada" }
```

### POST `/citas`
```json
// Request
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "id_paciente_fk": 1,
  "id_horario_medico_fk": 1,
  "observacion": "string | null"
}
// ⚠️ NO incluir id_medico_fk — el médico se infiere del horario
// ⚠️ estados posibles: 'Agendada','Cancelada','Atendida' (no 'No asistió')

// Response 201
{ "data": { "id_cita": 1, "estado": "Agendada" } }
// Response 409
{ "detail": "El horario ya está ocupado en esa fecha y hora" }
```

### PUT `/citas/{id_cita}`
```json
// Request (campos opcionales)
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "observacion": "string"
}
// ⚠️ El estado NO se cambia por este endpoint — usar /cancelar o /consultas

// Response 200
{ "data": { "id_cita": 1 } }
```

### PUT `/citas/{id_cita}/cancelar`
```json
// Request
{ "motivo": "string" }
// El backend: cambia estado → 'Cancelada' e inserta en historial_citas

// Response 200
{ "data": { "id_cita": 1, "estado": "Cancelada" } }
// Response 400
{ "detail": "Solo se pueden cancelar citas en estado Agendada" }
```

### GET `/citas/{id_cita}/historial`
```json
// Response 200
{
  "data": [
    {
      "id_historial": 1,
      "estado_anterior": "Agendada",
      "estado_nuevo": "Cancelada",
      "fecha_cambio": "ISO-8601",
      "motivo": "string"
    }
  ]
}
```

---

## 7. Consultas — Yefferson

### GET `/consultas?id_historia_clinica_fk={id}`
```json
// Response 200
{
  "data": [
    {
      "id_consulta": 1,
      "id_cita_fk": 1,
      "id_historia_clinica_fk": 1,
      "diagnostico": "string",
      "observacion": "string",
      "fecha": "YYYY-MM-DD",
      "servicios": [
        { "id_servicio": 1, "nombre": "Laboratorio" }
      ]
    }
  ]
}
```
> ⚠️ Cambiado: `fecha` viene de JOIN con `citas.fecha` — no es campo propio de consultas.
> `servicios` viene de JOIN con `consultas_servicios` → `servicios`.

### POST `/consultas`
```json
// Request
{
  "id_cita_fk": 1,
  "id_historia_clinica_fk": 1,
  "diagnostico": "string",
  "observacion": "string",
  "servicios_ids": [1, 2]
}
// El backend automáticamente:
// 1. Inserta en consultas
// 2. Inserta en consultas_servicios por cada servicio_id
// 3. Cambia cita.estado → 'Atendida' e inserta en historial_citas

// Response 201
{ "data": { "id_consulta": 1 } }
```

---

## 8. Historias Clínicas — Vanesa

### GET `/historias_clinicas?paciente_id={id}`
```json
// Response 200
{
  "data": [
    {
      "id_historia_clinica": 1,
      "id_paciente_fk": 1,
      "resumen": "string",
      "fecha_apertura": "YYYY-MM-DD",
      "antecedentes_personales": "string | null",
      "antecedentes_familiares": "string | null"
    }
  ]
}
```

### POST `/historias_clinicas`
```json
// Request
{
  "id_paciente_fk": 1,
  "resumen": "string | null",
  "fecha_apertura": "YYYY-MM-DD",
  "antecedentes_personales": "string | null",
  "antecedentes_familiares": "string | null"
}

// Response 201
{ "data": { "id_historia_clinica": 1 } }
// Response 409
{ "detail": "El paciente ya tiene una historia clínica" }
```

### PUT `/historias_clinicas/{id_historia_clinica}`
```json
// Request
{
  "resumen": "string",
  "antecedentes_personales": "string",
  "antecedentes_familiares": "string"
}

// Response 200
{ "data": { "id_historia_clinica": 1 } }
```

---

## 9. Signos Vitales — Vanesa

### POST `/signos_vitales`
```json
// Request
{
  "id_historia_clinica_fk": 1,
  "id_consulta_fk": 1,
  "peso": 70.5,
  "estatura": 1.75,
  "temperatura": 36.6,
  "presion_arterial": "120/80",
  "frecuencia_cardiaca": 80,
  "saturacion_oxigeno": 98
}
// id_consulta_fk es opcional — se puede registrar sin consulta

// Response 201
{ "data": { "id_signo": 1, "fecha_registro": "ISO-8601" } }
```

### GET `/signos_vitales?id_consulta_fk={id}`
```json
// Response 200
{
  "data": [
    {
      "id_signo": 1,
      "id_consulta_fk": 1,
      "id_historia_clinica_fk": 1,
      "peso": 70.5,
      "estatura": 1.75,
      "temperatura": 36.6,
      "presion_arterial": "120/80",
      "frecuencia_cardiaca": 80,
      "saturacion_oxigeno": 98,
      "fecha_registro": "ISO-8601"
    }
  ]
}
```

### GET `/signos_vitales?id_historia_clinica_fk={id}`
```json
// Response 200 — misma estructura, filtra por historia clínica
// Retorna todos los registros ordenados por fecha_registro DESC
```

---

## Resumen de cambios respecto al ENDPOINTS.md original

| # | Cambio | Afecta |
|---|--------|--------|
| 1 | `/auth/usuarios` → `/usuarios` | Andrea |
| 2 | Campo `nombre` en usuarios → `medico_nombre` via JOIN | Andrea |
| 3 | Campo `status` → `estado` en toda la API | Todos |
| 4 | `GET /estados` eliminado — ENUM hardcodeado | Frontend |
| 5 | `alergias` → endpoints propios `/pacientes/{id}/alergias` | Vanesa |
| 6 | `antecedentes` removido de POST /pacientes → va en historia clínica | Vanesa |
| 7 | Catálogos: `nombre` → nombres exactos del DDL (`nombre_eps`, `tipo_regimen`, etc.) | Vanesa |
| 8 | POST /medicos: `especialidad: string` → `especialidades: [ids]` | Yefferson |
| 9 | Horarios como sub-recurso: `/medicos/{id}/horarios` | Yefferson |
| 10 | POST /citas: eliminar `id_medico_fk` del request | Yefferson |
| 11 | Estado `"No asistió"` eliminado | Yefferson |
| 12 | `fecha_consulta` en consultas → `fecha` via JOIN con citas | Yefferson |
| 13 | historias_clinicas: agregar `antecedentes_personales` y `antecedentes_familiares` | Vanesa |
| 14 | signos_vitales: agregar GET por `id_historia_clinica_fk` | Vanesa |
| 15 | PUT `/historias_clinicas/{id}` nuevo endpoint | Vanesa |