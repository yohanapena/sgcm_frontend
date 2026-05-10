# Arquitectura Modular para Sistema de Citas Médicas

Este proyecto se organiza en una arquitectura modular pensando en:

- separación por *features* (auth, pacientes, citas, historia clínica, médico)
- servicios de datos desacoplados
- adaptador de backend / mock API reutilizable
- componentes de UI reutilizables
- datos simulados listos para conectar con un backend real más adelante

## Estructura propuesta

```
frontend/
  index.html
  src/
    main.js
    app/
      App.js
    api/
      magicLoops.js
      mockApi.js
    features/
      auth/
        authService.js
      pacientes/
        pacientesService.js
      citas/
        citasService.js
      historia/
        historiaService.js
      medico/
        medicoService.js
    constants/
      routes.js
      theme.js
    data/
      eps.js
      regimenes.js
      especialidades.js
      servicios.js
      medicos.js
      horarios.js
    utils/
      validations.js
```

## Razón de esta organización

- `src/api/` contiene el adaptador de datos y la capa de simulación (`magicLoops.js`, `mockApi.js`).
- `src/features/` agrupa la lógica de negocio por dominio y hace que cada pantalla sea independiente.
- `src/constants/` guarda rutas y temas, para que los valores de la interfaz no estén hardcodeados.
- `src/data/` mantiene los catálogos estáticos simulados.
- `src/utils/` centraliza validaciones y utilidades comunes.

## Cómo conectar el backend real después

1. Reemplazar o extender `src/api/magicLoops.js` con llamadas reales.
2. Mantener `features/*` consumiendo métodos como `listPacientes()`, `createCita()`, `loadHistoriaClinica()`.
3. No tocar los componentes de UI para cambiar la fuente de datos.

## Nota

El `index.html` actual conserva el diseño visual existente y carga `src/main.js` como punto de entrada.
