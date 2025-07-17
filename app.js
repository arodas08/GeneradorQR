// ---------------------------- app.js FINAL ----------------------------
// Todas las funciones completas: historial, imprimir, descargar, limpiar (con backup)

// ----------- Elementos DOM -----------------
const nombreInput        = document.getElementById('nombre');
const textoInput         = document.getElementById('texto');
const observacionesInput = document.getElementById('observaciones');
const btnGenerar         = document.getElementById('btn-generar');
const btnDescargar       = document.getElementById('btn-descargar');
const canvas             = document.getElementById('qrcode');
const tbody              = document.querySelector('#registro tbody');

// ----------- Estado ------------------------
let historial  = cargarHistorial();           // Array con registros previos
let contadorQR = historial.length + 1;        // Continuar numeración

// ----------- Utilidades --------------------
function guardarHistorial() {
  localStorage.setItem('qrHistory', JSON.stringify(historial));
}

function cargarHistorial() {
  try {
    return JSON.parse(localStorage.getItem('qrHistory')) || [];
  } catch {
    return [];
  }
}

function formatearFecha(date) {
  return date.toLocaleString('es-PY', { hour12: false });
}

// ----------- Validación --------------------
function validarCampos() {
  btnGenerar.disabled =
    nombreInput.value.trim() === '' ||
    textoInput.value.trim()  === '';
}

nombreInput.addEventListener('input', validarCampos);
textoInput.addEventListener('input', validarCampos);

// ----------- Cargar historial al iniciar ---
historial.forEach(insertarFila);

// ----------- Generar QR --------------------
function generarQR() {
  const nombre        = nombreInput.value.trim();
  const texto         = textoInput.value.trim();
  const observaciones = observacionesInput.value.trim();
  const color         = document.querySelector('input[name="color"]:checked').value;

  if (!texto) return;

  const contenidoQR = `Nombre: ${nombre}\nTexto: ${texto}\nObs: ${observaciones}`;

  QRCode.toCanvas(canvas, contenidoQR, {
    color: { dark: color, light: '#ffffff' },
    width: 200,
    margin: 2
  }, err => {
    if (err) {
      console.error(err);
      return;
    }

    btnDescargar.disabled = false;

    const registro = {
      id: contadorQR++,
      fechaISO: new Date().toISOString(),
      nombre,
      texto,
      observaciones
    };
    historial.push(registro);
    guardarHistorial();
    insertarFila(registro);
  });
}

// ----------- Insertar fila en la tabla -----
function insertarFila({ id, fechaISO, nombre, texto, observaciones }) {
  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${id}</td>
    <td>${formatearFecha(new Date(fechaISO))}</td>
    <td>${nombre}</td>
    <td>${texto}</td>
    <td>${observaciones}</td>
  `;
  tbody.appendChild(fila);
}

// ----------- Imprimir registro -------------
function imprimirRegistro() {
  const contenido = document.getElementById('registro-container').innerHTML;
  const ventana = window.open('', '', 'width=800,height=600');
  ventana.document.write(`
    <html>
      <head>
        <title>Registro de Códigos QR</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 1rem; }
          h3   { margin-top: 0; }
          table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
          th { background: #4169e1; color: #fff; }
        </style>
      </head>
      <body>${contenido}</body>
    </html>
  `);
  ventana.document.close();
  ventana.print();
}

// ----------- Descargar último QR ----------
function descargarQR() {
  if (canvas.width === 0) return;
  const enlace = document.createElement('a');
  const nombreQR = nombreInput.value.trim() || 'codigoQR';
  enlace.href = canvas.toDataURL('image/png');
  enlace.download = `${nombreQR}.png`;
  enlace.click();
}

// ----------- Reiniciar formulario ----------
function reiniciarFormulario() {
  nombreInput.value = '';
  textoInput.value = '';
  observacionesInput.value = '';
  document.querySelector('input[name="color"][value="#000000"]').checked = true;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  btnGenerar.disabled = true;
  btnDescargar.disabled = true;
  nombreInput.focus();
}

// ----------- Limpiar historial -------------
function limpiarRegistro() {
  // Mostrar el popup
  document.getElementById('popup-confirmacion').style.display = 'flex';
}

// Esta función se llama desde los botones del popup
function confirmarLimpiarRegistro(confirmado) {
  const popup = document.getElementById('popup-confirmacion');
  popup.style.display = 'none';

  if (!confirmado) return;

  // Guardar respaldo interno en localStorage
  localStorage.setItem('qrBackup', JSON.stringify(historial));

  // Borrar historial principal
  localStorage.removeItem('qrHistory');
  historial = [];
  contadorQR = 1;
  tbody.innerHTML = '';
}

function restaurarBackup() {
  const backup = JSON.parse(localStorage.getItem('qrBackup') || '[]');
  if (!backup.length) return alert('No hay respaldo disponible.');

  localStorage.setItem('qrHistory', JSON.stringify(backup));
  location.reload();
}


