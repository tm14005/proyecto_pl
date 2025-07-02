<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}" data-bs-theme="auto">
<head>
    <meta charset="UTF-8">
    <title>Programación Lineal Método Gráfico - Laravel + Python + Chart.js</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="{{ asset('css/lp.css') }}" rel="stylesheet">
    <!-- Chart.js 4.x y plugin zoom 2.x compatibles -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1"></script>
    <!-- jsPDF para exportar como PDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <!-- html2canvas para capturar contenido HTML como imagen -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body style="padding-top:0;">
    <header class="bg-dark text-white py-3" style="margin-bottom:10px;">
        <div class="container">
            <h1 class="h3 m-0 text-center">Proyecto Programación Lineal - Método Gráfico</h1>
        </div>
    </header>
<a href="#contenido-principal" class="visually-hidden-focusable" tabindex="0">{{ __('messages.skip_to_main') ?? 'Saltar al contenido principal' }}</a>
<div class="container" >
    <div class="d-flex justify-content-end mb-2">
        <button id="btn-presentacion" class="btn btn-outline-secondary btn-sm">
         Comenzar la presentación
        </button>&nbsp;
        <button class="btn btn-outline-secondary btn-sm" id="boton-tema" aria-label="{{ __('messages.toggle_theme') }}" tabindex="0">
            🌗 {{ __('messages.toggle_theme') }}
        </button> &nbsp;
        <form action="{{ route('language.switch') }}" method="POST" id="form-idioma" aria-label="Selector de idioma">
            @csrf
            <label for="select-idioma" class="visually-hidden">{{ __('messages.select_language') ?? 'Seleccionar idioma' }}</label>
            <select id="select-idioma" name="locale" onchange="this.form.submit()" class="border rounded p-1" aria-label="{{ __('messages.select_language') ?? 'Seleccionar idioma' }}">
                <option value="es" {{ app()->getLocale() == 'es' ? 'selected' : '' }}>{{ __('messages.spanish') }}</option>
                <option value="en" {{ app()->getLocale() == 'en' ? 'selected' : '' }}>{{ __('messages.english') }}</option>
            </select>
        </form>
    </div>

    <main id="contenido-principal" tabindex="-1">
        <div class="card shadow-sm mb-4">
            <div class="card-body">
                <h2 class="card-title mb-4 text-primary" id="titulo-pl">{{ __('messages.lp_problem') }}</h2>
                <div class="mb-3">
                    <label for="ejemplo-pl" class="form-label">{{ __('messages.quick_examples') }}</label>
                    <select class="form-select" id="ejemplo-pl" aria-labelledby="titulo-pl">
                        <option value="">{{ __('messages.select_example') }}</option>
                        <option value="ej1">{{ __('messages.maximize_simple') }}</option>
                        <option value="ej2">{{ __('messages.minimize_cost') }}</option>
                        <option value="ej3">{{ __('messages.limited_production') }}</option>
                    </select>
                </div>
                <form id="form-pl" aria-label="{{ __('messages.lp_problem') }}">
                    <div class="mb-3">
                        <label for="funcion-objetivo" class="form-label">{{ __('messages.objective_function') }}</label>
                        <input type="text" id="funcion-objetivo" name="funcion_objetivo" class="form-control" placeholder="{{ __('messages.objective_placeholder') }}" required aria-required="true" aria-describedby="desc-objetivo">
                        <span id="desc-objetivo" class="form-text">{{ __('messages.objective_placeholder') }}</span>
                    </div>
                    <div class="mb-3">
                        <label for="restricciones" class="form-label">{{ __('messages.constraints') }}</label>
                        <textarea id="restricciones" name="restricciones" rows="5" class="form-control" placeholder="{{ __('messages.constraints_placeholder') }}" required aria-required="true" aria-describedby="desc-restricciones"></textarea>
                        <span id="desc-restricciones" class="form-text">{{ __('messages.constraints_placeholder') }}</span>
                    </div>
                    <button type="submit" class="btn btn-success" id="boton-resolver" aria-label="{{ __('messages.solve_and_plot') }}">
                        {{ __('messages.solve_and_plot') }}
                    </button>
                    <div id="cargando" class="ms-3 spinner-border text-primary" role="status" aria-live="polite">
                        <span class="visually-hidden">{{ __('messages.loading') }}</span>
                    </div>
                </form>
            </div>
        </div>
        <div id="resultado" style="display:none;">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <h4 class="card-title text-secondary">{{ __('messages.result') }}</h4>
                    <div id="optimo" class="mb-3"></div>
                    <div class="ratio ratio-4x3">
                        <canvas id="canvas-pl" role="img" aria-label="{{ __('messages.feasible_region') }}"></canvas>
                    </div>
                    <div class="mt-2">
                        <button id="reiniciar-zoom" class="btn btn-outline-info btn-sm" aria-label="{{ __('messages.reset_zoom') }}">
                            {{ __('messages.reset_zoom') }}
                        </button>
                        <button id="descargar-png" class="btn btn-outline-success btn-sm" aria-label="{{ __('messages.download_png') }}">
                            {{ __('messages.download_png') }}
                        </button>
                        <button id="descargar-pdf" class="btn btn-outline-danger btn-sm" aria-label="{{ __('messages.download_pdf') }}">
                            {{ __('messages.download_pdf') }}
                        </button>
                        <button id="descargar-todo-pdf" class="btn btn-outline-primary btn-sm" aria-label="{{ __('messages.export_all_pdf') }}">
                            {{ __('messages.export_all_pdf') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>

<!-- Modal de presentación -->
<div class="modal fade" id="modalPresentacion" tabindex="-1" aria-labelledby="modalPresentacionLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalPresentacionLabel">Presentación del Proyecto</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body" id="modalPresentacionCuerpo">
        <!-- Aquí irá el contenido dinámico -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="btnAnterior" style="display:none">Anterior</button>
        <button type="button" class="btn btn-primary" id="btnSiguiente">Siguiente</button>
      </div>
    </div>
  </div>
</div>

<footer class="bg-dark text-white text-center py-2 " style="z-index:1030;">
    Materia: Métodos de Optimización. | Alumno: Mario Nelson Torres Mena
</footer>

<script>
    // Traducciones JS desde PHP para el archivo JS
    window.traduccionesPL = {
        estado: @json(__('messages.status')),
        valor_optimo: @json(__('messages.optimal_value')),
        variables: @json(__('messages.variables')),
        sin_solucion_optima: @json(__('messages.no_optimal_solution')),
        restriccion: @json(__('messages.restriction')),
        etiqueta_objetivo: @json(__('messages.objective_function_label')),
        region_factible: @json(__('messages.feasible_region')),
        vertices: @json(__('messages.vertices')),
        optimo: @json(__('messages.optimal')),
        x: @json(__('messages.x')),
        y: @json(__('messages.y')),
        sin_region_factible: @json(__('messages.no_feasible_region')),
        error: @json(__('messages.error')),
        error_servidor: @json(__('messages.server_error')),
    };
</script>
<script src="{{ asset('js/lp.js') }}"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="{{ asset('js/presentacion.js') }}"></script>
</body>
</html>
