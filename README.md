# OrdenesOnlineWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Seguimiento de propuestas

`/Clientes/seguimiento` consulta `GET /api/PropuestaCliente/seguimiento` y muestra las propuestas del día de Perú (UTC-05), desde la tabla `propuesta` de DATAWEB. El backend convierte ese día a un intervalo UTC para filtrar `Fecha_Registro` y mantiene el alcance de clientes del usuario autenticado.

Las pestañas son Todas, BVL, Canaccord y Euroclear. No hay filtros Desde/Hasta. Las propuestas sin una política identificable, como las antiguas guardadas como `Extranjero`, aparecen únicamente en Todas con su mercado original. Las nuevas órdenes de ambos portales permiten identificar la política; el backend de Clientes acepta `01` (BVL), `98` (Canaccord) y `16` (Euroclear).

Por ahora, el seguimiento muestra todas las propuestas como Pendiente, con cantidad ejecutada y anulada en cero. No requiere coincidencias con operaciones externas ni modifica el estado de revisión de la propuesta. La actualización automática conserva los filtros y la página actual cuando sigue existiendo.

Este cambio requiere publicar frontend y backend juntos. El endpoint antiguo `/api/PropuestaCliente/seguimiento/bvl` fue retirado; se utiliza el endpoint combinado indicado arriba.

## Horario de recepción y vigencia

El horario se aplica a BVL, Canaccord y Euroclear en ambos portales. `GET /api/MarketHours` informa la hora del servidor y la sesión disponible. La pantalla actualiza el estado al llegar al cierre; el backend valida nuevamente cada envío.

- Representantes: pueden registrar desde las 06:00 hasta el cierre configurado. Fuera de ese horario, una capa de bloqueo muestra el próximo inicio de recepción y conserva el formulario mientras la pantalla permanezca abierta.
- Clientes: pueden registrar después del cierre para la próxima sesión. La opción diaria muestra **Solo para mañana** y la fecha, o **Próxima sesión** si siguen días sin negociación. Se guarda y se envía por correo una fecha absoluta, como `Solo el 08/09/2026`.
- Si el cierre ocurre durante el envío, la API responde `409` cuando la vigencia quedó desactualizada. Se conserva el formulario para revisar la nueva fecha y volver a enviar.

La configuración está en `OrdenesOnline-API/market-hours.json` del backend y debe incluirse al publicar. Los horarios están expresados en hora de Perú:

- `OrderEntryOpen`: inicio fijo de recepción para representantes a las 06:00.
- `EarlySeason.Close`: cierre a las 15:00, desde el segundo domingo de marzo.
- `LateSeason.Close`: cierre a las 16:00, desde el primer domingo de noviembre. En 2026, la primera sesión de ese período corresponde al lunes 2 de noviembre.
- `ClosedDates`: feriados bursátiles; se cargó el calendario oficial de 2026. Actualizar esta lista para los años siguientes.
- `Overrides`: excepciones por fecha para `Close` o `IsClosed`. Por ejemplo, `"2026-12-24": { "Close": "13:00" }` permitiría configurar un cierre especial; es solo un ejemplo, no un horario oficial cargado. La apertura bursátil no modifica el inicio fijo de recepción.

El servidor relee los cambios de ese archivo. También admite variables como `MarketHours__OrderEntryOpen` y `MarketHours__EarlySeason__Close`. La recepción inicia a una hora única y el cambio estacional solo ajusta el cierre; las modificaciones extraordinarias de la BVL requieren actualizar la configuración. Se utiliza el corte solicitado de 15:00/16:00, sin incluir fases posteriores de negociación.

Fuentes: [horarios y cambio estacional de la BVL](https://documents.bvl.com.pe/empresas/alertas/DISPOSICIONES%20COMPLEMENTARIAS%20AL%20RO%2024.11.pdf) y [calendario de feriados bursátiles 2026](https://documents.bvl.com.pe/pubdif/boldia/bolnota.htm).
