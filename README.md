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
