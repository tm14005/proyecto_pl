// Pasos de la presentación
const pasosPresentacion = [
  {
    titulo: "Objetivo del proyecto",
    contenido: `
      <p>
        El objetivo es resolver ejercicios de <strong>Programación Lineal</strong> de dos variables usando el método gráfico, permitiendo que el usuario introduzca el problema y visualice la región factible, las restricciones y el óptimo, todo a través de una interfaz web amigable.
      </p>
    `
  },
  {
    titulo: "¿Cómo está dividido el proyecto?",
    contenido: `
      <ul>
        <li><strong>Frontend:</strong> HTML, JS y Chart.js (para la gráfica interactiva).</li>
        <li><strong>Backend principal:</strong> Laravel (PHP) recibe las solicitudes del usuario y se comunica con Python.</li>
        <li><strong>Backend matemático:</strong> Python resuelve el problema usando SymPy.</li>
        <li><strong>Comunicación:</strong> El frontend usa <code>fetch</code> (AJAX) para enviar datos a Laravel, que a su vez contacta a Python/Flask.</li>
      </ul>
    `
  },
  {
    titulo: "¿Cómo funciona el flujo completo?",
    contenido: `
      <ol>
        <li>El usuario ingresa la función objetivo y restricciones en la web.</li>
        <li>El frontend envía los datos al backend usando <code>fetch</code>.</li>
        <li>Laravel recibe la solicitud y la reenvía al backend Python.</li>
        <li>Python resuelve el problema con SymPy y calcula la solución óptima.</li>
        <li>Laravel retorna los resultados al frontend.</li>
        <li>Chart.js dibuja la gráfica con la región factible, restricciones y punto óptimo.</li>
      </ol>
    `
  },
  {
    titulo: "¿Por qué usar Python/SymPy?",
    contenido: `
      <p>
        <strong>SymPy</strong> permite manipular y resolver expresiones simbólicas fácilmente. El método gráfico requiere calcular intersecciones y regiones factibles, lo cual es más sencillo y robusto en Python que en PHP.
      </p>
    `
  },
  {
    titulo: "¿Por qué Laravel como puente?",
    contenido: `
      <p>
        Laravel permite integrar el frontend con autenticación, control de usuarios, vistas, y sirve como API para comunicarse con Python, combinando lo mejor de ambos lenguajes.
      </p>
    `
  },
  {
    titulo: "¿Cómo se grafican los resultados?",
    contenido: `
      <ul>
        <li>Se usa <strong>Chart.js</strong> para graficar restricciones, región factible, vértices y punto óptimo.</li>
        <li>El usuario puede visualizar de forma clara la solución del problema.</li>
      </ul>
    `
  },
  {
    titulo: "¿Qué mejoras respecto a la entrada de datos?",
    contenido: `
      <p>
        El usuario puede escribir expresiones como <code>3x + 2y</code> (sin asteriscos). El backend es flexible y entiende la notación matemática usual.
      </p>
    `
  },
  {
    titulo: "¿Qué desafíos técnicos hubo?",
    contenido: `
      <ul>
        <li>La comunicación entre PHP y Python y el manejo de expresiones matemáticas.</li>
        <li>El manejo de errores (sin región factible, sintaxis incorrecta, etc).</li>
      </ul>
    `
  },
  {
    titulo: "¿Cuál sería el flujo del código?",
    contenido: `
      <p>
        El backend Laravel recibe los datos del usuario y los reenvía a Python.<br>
        Python calcula la solución óptima y los envía de vuelta a Laravel.<br>
        El frontend recibe los datos y los grafica.<br>
        Cada parte se encarga de una tarea específica, facilitando el mantenimiento y escalabilidad.
      </p>
    `
  },
  {
    titulo: "¡Gracias por su atención!",
    contenido: `
      <p>
.
      </p>
    `
  }
];

// Estado actual del paso
let pasoActual = 0;

// Función para actualizar el modal con el paso actual
function actualizarModalPresentacion() {
  const paso = pasosPresentacion[pasoActual];
  document.getElementById('modalPresentacionLabel').innerHTML = paso.titulo;
  document.getElementById('modalPresentacionCuerpo').innerHTML = paso.contenido;
  document.getElementById('btnAnterior').style.display = pasoActual === 0 ? 'none' : '';
  document.getElementById('btnSiguiente').innerText = pasoActual === pasosPresentacion.length - 1 ? 'Finalizar' : 'Siguiente';
}

// Evento para abrir la presentación
document.getElementById('btn-presentacion').addEventListener('click', function() {
  pasoActual = 0;
  actualizarModalPresentacion();
  var modal = new bootstrap.Modal(document.getElementById('modalPresentacion'));
  modal.show();
});

// Botón siguiente
document.getElementById('btnSiguiente').addEventListener('click', function() {
  if (pasoActual < pasosPresentacion.length - 1) {
    pasoActual++;
    actualizarModalPresentacion();
  } else {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalPresentacion'));
    modal.hide();
  }
});

// Botón anterior
document.getElementById('btnAnterior').addEventListener('click', function() {
  if (pasoActual > 0) {
    pasoActual--;
    actualizarModalPresentacion();
  }
});
