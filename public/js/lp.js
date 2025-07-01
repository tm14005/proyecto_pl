// Registra el plugin de zoom si lo usas
Chart.register(window.ChartZoom);

// Ejemplos precargados
const ejemplos = {
    ej1: {
        funcion_objetivo: "max: 3*x + 5*y",
        restricciones: `x + 2*y <= 14
3*x + y >= 0
x >= 0
y >= 0`
    },
    ej2: {
        funcion_objetivo: "min:4*x + 6*y",
        restricciones: `x + y >= 5
2*x + y >= 6
x >= 0
y >= 0`
    },
    ej3: {
        funcion_objetivo: "max:120*x + 80*y",
        restricciones: `6*x + 4*y <= 240
x + 2*y <= 100
x >= 0
y >= 0`
    }
};

// Autocompletar ejemplos
document.getElementById('ejemplo-pl').addEventListener('change', function() {
    const val = this.value;
    if (ejemplos[val]) {
        document.getElementById('funcion-objetivo').value = ejemplos[val].funcion_objetivo;
        document.getElementById('restricciones').value = ejemplos[val].restricciones;
        document.getElementById('funcion-objetivo').focus();
    }
});

// Tema
document.getElementById('boton-tema').addEventListener('keydown', function(e) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
    }
});
document.getElementById('boton-tema').addEventListener('click', () => {
    const html = document.documentElement;
    const actual = html.getAttribute('data-bs-theme');
    if (actual === 'dark') {
        html.setAttribute('data-bs-theme', 'light');
    } else if (actual === 'light') {
        html.setAttribute('data-bs-theme', 'dark');
    } else {
        const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-bs-theme', prefiereOscuro ? 'light' : 'dark');
    }
});

// ========== ENVÍO DEL FORMULARIO PRINCIPAL ==========
document.getElementById('form-pl').addEventListener('submit', function (e) {
    e.preventDefault();

    const form = e.target;
    const cargando = document.getElementById('cargando');
    const botonResolver = document.getElementById('boton-resolver');
    const resultado = document.getElementById('resultado');
    const optimo = document.getElementById('optimo');
    const ctx = document.getElementById('canvas-pl').getContext('2d');

    cargando.style.display = "inline-block";
    botonResolver.disabled = true;
    resultado.style.display = "none";
    optimo.innerHTML = "";
    if (window.plGrafico) window.plGrafico.destroy();

    // --- NUEVO: Enviar expresiones directas al backend ---
    let fo_raw = form.funcion_objetivo.value.trim();
    let tipo = 'max';
    let objetivo = fo_raw;
    // Detectar min/max en el input
    const fo_match = fo_raw.match(/^(max|min)\s*:\s*(.*)$/i);
    if (fo_match) {
        tipo = fo_match[1].toLowerCase();
        objetivo = fo_match[2];
    }

    let restr_raw = form.restricciones.value.trim().split('\n').map(r => r.trim()).filter(r => r.length > 0);

    const data = {
        tipo,
        objetivo,
        restricciones: restr_raw
    };

    fetch('/resolver-lp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) throw new Error(window.traduccionesPL.error_servidor);
        return res.json();
    })
    .then(json => {
        cargando.style.display = "none";
        botonResolver.disabled = false;
        resultado.style.display = "";
        if (json.estado && json.estado.toLowerCase().includes('óptimo')) {
            // Mostrar punto óptimo y datos
            optimo.innerHTML =
                `<p><strong>${window.traduccionesPL.estado}</strong> ${json.optimo ? json.optimo.x !== undefined ? json.estado : '' : ''}</p>
                 <p><strong>${window.traduccionesPL.x}</strong> ${json.optimo ? json.optimo.x : ''}</p>
                 <p><strong>${window.traduccionesPL.y}</strong> ${json.optimo ? json.optimo.y : ''}</p>
                 <p><strong>Z</strong> ${json.optimo ? json.optimo.z : ''}</p>`;

            // Preparar datasets para gráfica completa
            let datasets = [];

            // Restricciones como líneas
            if (json.restricciones) {
                json.restricciones.forEach((r, idx) => {
                    datasets.push({
                        label: r.expr,
                        data: [
                            { x: r.p1[0], y: r.p1[1] },
                            { x: r.p2[0], y: r.p2[1] }
                        ],
                        borderColor: 'rgba(200,0,0,0.7)',
                        backgroundColor: 'rgba(200,0,0,0.4)',
                        borderDash: [4,2],
                        fill: false,
                        showLine: true,
                        parsing: false,
                        pointRadius: 0,
                        type: 'line',
                        order: 2
                    });
                });
            }

            // Región factible (polígono)
            if (json.factible && json.factible.length > 2) {
                datasets.push({
                    label: "Región factible",
                    data: json.factible.map(p => ({ x: p[0], y: p[1] })).concat([{ x: json.factible[0][0], y: json.factible[0][1] }]),
                    backgroundColor: 'rgba(0, 200, 0, 0.12)',
                    borderColor: 'rgba(0, 200, 0, 0.5)',
                    showLine: true,
                    fill: 'start',
                    pointRadius: 0,
                    type: 'line',
                    order: 1
                });
            }

            // Vértices de la región factible
            if (json.vertices) {
                datasets.push({
                    label: "Vértices",
                    data: json.vertices.map(p => ({ x: p[0], y: p[1] })),
                    backgroundColor: 'blue',
                    borderColor: 'white',
                    pointRadius: 6,
                    showLine: false,
                    type: 'scatter',
                    order: 3
                });
            }

            // Punto óptimo (estrella)
            if (json.optimo) {
                datasets.push({
                    label: window.traduccionesPL.optimo,
                    data: [{ x: json.optimo.x, y: json.optimo.y }],
                    backgroundColor: 'gold',
                    borderColor: 'black',
                    pointRadius: 10,
                    pointStyle: 'star',
                    showLine: false,
                    type: 'scatter',
                    order: 4
                });
            }

            // Línea de nivel de la función objetivo (opcional)
            if (json.objetivo) {
                datasets.push({
                    label: "Función objetivo (nivel óptimo)",
                    data: [
                        { x: json.objetivo.p1[0], y: json.objetivo.p1[1] },
                        { x: json.objetivo.p2[0], y: json.objetivo.p2[1] }
                    ],
                    borderColor: 'purple',
                    borderDash: [8, 4],
                    fill: false,
                    showLine: true,
                    pointRadius: 0,
                    type: 'line',
                    order: 5
                });
            }

            // Determinar límites de ejes
            const xs = [
                ...(json.vertices ? json.vertices.map(p => p[0]) : []),
                ...(json.optimo ? [json.optimo.x] : [])
            ];
            const ys = [
                ...(json.vertices ? json.vertices.map(p => p[1]) : []),
                ...(json.optimo ? [json.optimo.y] : [])
            ];
            const minX = Math.floor(Math.min(...xs, 0));
            const maxX = Math.ceil(Math.max(...xs, 1));
            const minY = Math.floor(Math.min(...ys, 0));
            const maxY = Math.ceil(Math.max(...ys, 1));

            // Destruye gráfico anterior si existe
            if (window.plGrafico) window.plGrafico.destroy();

            window.plGrafico = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: window.traduccionesPL.x }, beginAtZero: true, min: minX, max: maxX },
                        y: { title: { display: true, text: window.traduccionesPL.y }, beginAtZero: true, min: minY, max: maxY }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Gráfica de Programación Lineal' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.dataset.label === window.traduccionesPL.optimo) {
                                        return `Óptimo (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                                    }
                                    if (context.dataset.label === "Vértices") {
                                        return `Vértice (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                                    }
                                    if (context.dataset.label === "Región factible") {
                                        return null;
                                    }
                                    if (context.dataset.label.startsWith("Función objetivo")) {
                                        return null;
                                    }
                                    return `${context.dataset.label}: (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                                }
                            }
                        },
                        zoom: {
                            zoom: {
                                wheel: { enabled: true },
                                pinch: { enabled: true },
                                mode: 'xy'
                            },
                            pan: {
                                enabled: true,
                                mode: 'xy'
                            }
                        }
                    }
                }
            });
        } else {
            optimo.innerHTML =
                `<div class="alert alert-danger">${window.traduccionesPL.sin_solucion_optima}: ${json.mensaje || ''}</div>`;
        }
    })
    .catch(err => {
        cargando.style.display = "none";
        botonResolver.disabled = false;
        resultado.style.display = "";
        optimo.innerHTML = `<div class="alert alert-warning">${window.traduccionesPL.error} ${err.message}</div>`;
    });
});

// ========== Botones extra (zoom, PNG, PDF, Exportar todo PDF) ==========
document.addEventListener('DOMContentLoaded', function () {
    // Reiniciar Zoom
    const btnReiniciarZoom = document.getElementById('reiniciar-zoom');
    if (btnReiniciarZoom) {
        btnReiniciarZoom.addEventListener('click', function () {
            if (window.plGrafico && window.plGrafico.resetZoom) window.plGrafico.resetZoom();
        });
    }
    // Descargar PNG
    const btnDescargarPng = document.getElementById('descargar-png');
    if (btnDescargarPng) {
        btnDescargarPng.addEventListener('click', function () {
            const canvas = document.getElementById('canvas-pl');
            const link = document.createElement('a');
            link.download = 'grafico.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
    // Descargar PDF solo gráfica
    const btnDescargarPdf = document.getElementById('descargar-pdf');
    if (btnDescargarPdf) {
        btnDescargarPdf.addEventListener('click', function () {
            const { jsPDF } = window.jspdf;
            const canvas = document.getElementById('canvas-pl');
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "pt",
                format: "a4"
            });
            // Ajusta el tamaño y posición según sea necesario
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 50;
            const imgHeight = pageHeight - 100;
            pdf.addImage(imgData, 'PNG', 25, 40, imgWidth, imgHeight);
            pdf.save('grafico.pdf');
        });
    }
    // Exportar TODO el resultado a PDF (incluye óptimo, variables, gráfica, etc)
    const btnDescargarTodoPdf = document.getElementById('descargar-todo-pdf');
    if (btnDescargarTodoPdf) {
        btnDescargarTodoPdf.addEventListener('click', function () {
            const resultadoCard = document.querySelector('#resultado .card'); // Solo la tarjeta de resultado
            if (!resultadoCard) return;
            html2canvas(resultadoCard, {scale: 2}).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new window.jspdf.jsPDF({
                    orientation: "portrait",
                    unit: "pt",
                    format: "a4"
                });
                // Ajusta el tamaño de la imagen al ancho de la página
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
                const imgWidth = canvas.width * ratio;
                const imgHeight = canvas.height * ratio;
                pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight);
                pdf.save('resultado.pdf');
            });
        });
    }
});
