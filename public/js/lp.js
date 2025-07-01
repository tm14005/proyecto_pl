Chart.register(window.ChartZoom);

// Ejemplos precargados
const ejemplos = {
    ej1: {
        funcion_objetivo: "max: 3x + 5y",
        restricciones: `x + 2y <= 14
3x + y >= 0
x >= 0
y >= 0`
    },
    ej2: {
        funcion_objetivo: "min: 4x + 6y",
        restricciones: `x + y >= 5
2x + y >= 6
x >= 0
y >= 0`
    },
    ej3: {
        funcion_objetivo: "max: 120x + 80y",
        restricciones: `6x + 4y <= 240
x + 2y <= 100
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

// Permite activar el botón de tema con Enter o Espacio
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

// Envío del formulario principal
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

    // Enviar datos con nombres en español, como espera el backend
    const data = {
        funcion_objetivo: form.funcion_objetivo.value,
        restricciones: form.restricciones.value
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
        if (json.status && json.status.toLowerCase().includes('optimo')) {
            let vars = "";
            if (json.variables) {
                vars = Object.entries(json.variables)
                    .map(([v, val]) => `<span class="badge bg-info text-dark me-1">${v} = ${val}</span>`)
                    .join(' ');
            }
            optimo.innerHTML =
                `<p><strong>${window.traduccionesPL.estado}</strong> ${json.status}</p>
                 <p><strong>${window.traduccionesPL.valor_optimo}</strong> ${json.objective}</p>
                 <p><strong>${window.traduccionesPL.variables}</strong><br>${vars}</p>`;
        } else {
            optimo.innerHTML =
                `<div class="alert alert-danger">${window.traduccionesPL.sin_solucion_optima}</div>`;
        }

        let regionArr = Array.isArray(json.region) ? json.region : [];
        let restriccionesData = [];

        if (Array.isArray(json.restricciones)) {
            restriccionesData = json.restricciones.map((segmento, idx) => ({
                label: `${window.traduccionesPL.restriccion} ${idx + 1}`,
                data: segmento.map(([x, y]) => ({ x, y })),
                borderColor: 'red',
                backgroundColor: 'rgba(255,0,0,0.05)',
                fill: false,
                showLine: true,
                pointRadius: 0,
                borderDash: [6, 6],
                tension: 0,
                type: 'line',
                order: 0
            }));
        }

        let objetivoSegmento = json.objetivo_segmento;

        if (regionArr.length > 2) {
            window.plGrafico = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                        ...restriccionesData,
                        ...(objetivoSegmento && objetivoSegmento.length === 2 ? [{
                            label: window.traduccionesPL.etiqueta_objetivo,
                            data: objetivoSegmento.map(([x, y]) => ({ x, y })),
                            borderColor: 'green',
                            backgroundColor: 'rgba(0,200,0,0.1)',
                            showLine: true,
                            pointRadius: 0,
                            borderDash: [8, 4],
                            tension: 0,
                            type: 'line',
                            order: 0.5
                        }] : []),
                        {
                            label: window.traduccionesPL.region_factible,
                            data: [...regionArr, regionArr[0]].map(([x, y]) => ({ x, y })),
                            backgroundColor: 'rgba(0, 200, 255, 0.15)',
                            borderColor: 'rgba(0, 200, 255, 0.8)',
                            fill: "start",
                            showLine: true,
                            pointRadius: 0,
                            tension: 0,
                            type: 'line',
                            order: 1
                        },
                        {
                            label: window.traduccionesPL.vertices,
                            data: regionArr.map(([x, y]) => ({ x, y })),
                            borderColor: 'rgba(0, 200, 255, 1)',
                            backgroundColor: 'rgba(0, 200, 255, 0.5)',
                            showLine: false,
                            pointRadius: 5,
                            type: 'scatter',
                            order: 2
                        },
                        ...(json.optimum && json.optimum.x !== undefined && json.optimum.y !== undefined ? [{
                            label: window.traduccionesPL.optimo,
                            data: [{ x: json.optimum.x, y: json.optimum.y }],
                            borderColor: 'black',
                            backgroundColor: 'yellow',
                            pointRadius: 8,
                            showLine: false,
                            type: 'scatter',
                            order: 3
                        }] : [])
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: window.traduccionesPL.x }, beginAtZero: true },
                        y: { title: { display: true, text: window.traduccionesPL.y }, beginAtZero: true }
                    },
                    plugins: {
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
            ctx.font = "18px Arial";
            ctx.fillStyle = "red";
            ctx.fillText(window.traduccionesPL.sin_region_factible, 30, 200);
        }
    })
    .catch(err => {
        cargando.style.display = "none";
        botonResolver.disabled = false;
        resultado.style.display = "";
        optimo.innerHTML = `<div class="alert alert-warning">${window.traduccionesPL.error} ${err.message}</div>`;
    });
});

// Botones extra (zoom, PNG, PDF, Exportar todo PDF)
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
