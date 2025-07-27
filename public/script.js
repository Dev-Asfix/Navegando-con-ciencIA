// public/script.js

// --- Variables Globales ---
// Arrays para almacenar datos de sensores para los gráficos
let phData = [];
let tempData = [];
let turbidityData = [];
let labels = []; // Etiquetas de tiempo para el eje X de los gráficos

const MAX_DATA_POINTS = 20; // Número máximo de puntos de datos para mostrar en los gráficos

// Variables para el mapa y el marcador de Leaflet
let map;
let marker;

// --- Configuración de Gráficos ---
// Función auxiliar para crear y configurar una nueva instancia de Chart.js
const createChart = (ctx, label, color, dataArr) => {
    return new Chart(ctx, {
        type: 'line', // Tipo de gráfico de línea
        data: {
            labels: labels, // Usa el array global de etiquetas de tiempo
            datasets: [{
                label: label, // Etiqueta para el conjunto de datos (ej. "Nivel de pH")
                data: dataArr, // Usa el array de datos específico (ej. phData)
                borderColor: color, // Color de la línea
                backgroundColor: `${color}40`, // Color de relleno (con 40% de opacidad)
                fill: true, // Rellenar el área bajo la línea
                tension: 0.1 // Suavidad de la línea
            }]
        },
        options: {
            responsive: true, // El gráfico se redimensiona con su contenedor
            maintainAspectRatio: false, // No forzar la relación de aspecto
            scales: {
                y: {
                    beginAtZero: false // El eje Y no tiene por qué empezar en cero
                }
            },
            plugins: {
                legend: {
                    display: true // Mostrar leyenda para el conjunto de datos
                }
            }
        }
    });
};

// Obtener los contextos de los elementos canvas para los gráficos
const phChartCtx = document.getElementById('phChart').getContext('2d');
const tempChartCtx = document.getElementById('tempChart').getContext('2d');
const turbidityChartCtx = document.getElementById('turbidityChart').getContext('2d');

// Inicializar las instancias de Chart.js
const phChart = createChart(phChartCtx, 'Nivel de pH', 'rgb(75, 192, 192)', phData);
const tempChart = createChart(tempChartCtx, 'Temperatura (°C)', 'rgb(255, 99, 132)', tempData);
const turbidityChart = createChart(turbidityChartCtx, 'Turbidez (NTU)', 'rgb(255, 205, 86)', turbidityData);

// --- Inicialización del Mapa ---
function initMap() {
    // Coordenadas iniciales centradas alrededor de Paita, Piura, Perú (aproximado)
    const initialLat = -5.0886;
    const initialLon = -81.1186;

    // Inicializar el mapa y establecer su vista
    map = L.map('mapid').setView([initialLat, initialLon], 13); // Nivel de zoom 13

    // Añadir las capas de OpenStreetMap al mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Añadir un marcador en la posición inicial
    marker = L.marker([initialLat, initialLon]).addTo(map)
        .bindPopup("Ubicación actual del barco") // Texto del popup
        .openPopup(); // Mostrar el popup
}

// --- Conexión WebSocket y Manejo de Eventos ---
// Conectar al servidor Socket.IO de Node.js
const socket = io('http://localhost:3000'); // ¡Asegúrate de que esta URL y puerto coincidan con tu servidor Node.js!

// Oyente de eventos para una conexión exitosa
socket.on('connect', () => {
    console.log('Conectado al servidor WebSocket.');
});

// Oyente de eventos para actualizaciones entrantes de datos de sensores
socket.on('sensor_update', (data) => {
    console.log('Datos recibidos vía WebSocket:', data); // Registrar los datos recibidos

    const now = new Date();
    const timeLabel = now.toLocaleTimeString(); // Formatear la hora actual para las etiquetas del gráfico

    // Actualizar los valores mostrados en la página HTML
    document.getElementById('ph-value').textContent = data.pH;
    document.getElementById('temp-value').textContent = data.temperatura;
    document.getElementById('turbidity-value').textContent = data.turbidez;
    document.getElementById('gps-value').textContent = `${data.latitud.toFixed(4)}, ${data.longitud.toFixed(4)}`; // Formatear GPS para mostrar menos decimales

    // Actualizar datos para los gráficos
    // Si excedemos MAX_DATA_POINTS, eliminar el punto más antiguo
    if (labels.length >= MAX_DATA_POINTS) {
        labels.shift();
        phData.shift();
        tempData.shift();
        turbidityData.shift();
    }
    // Añadir el nuevo punto de datos
    labels.push(timeLabel);
    phData.push(data.pH);
    tempData.push(data.temperatura);
    turbidityData.push(data.turbidez);

    // Actualizar los gráficos para que reflejen los nuevos datos
    phChart.update();
    tempChart.update();
    turbidityChart.update();

    // Actualizar la posición del marcador en el mapa
    if (marker) {
        marker.setLatLng([data.latitud, data.longitud]);
        // Opcional: descomenta la siguiente línea si quieres que el mapa se centre automáticamente
        // en el marcador a medida que se mueve.
        // map.setView([data.latitud, data.longitud]);
    }
});

// Oyente de eventos para desconexión
socket.on('disconnect', () => {
    console.log('Desconectado del servidor WebSocket.');
});

// Oyente de eventos para errores de conexión
socket.on('connect_error', (err) => {
    console.error(`Error de conexión WebSocket: ${err.message}`);
    // Opcionalmente, mostrar un mensaje de error en la interfaz de usuario
    document.getElementById('ph-value').textContent = "Error";
    document.getElementById('temp-value').textContent = "Error";
    document.getElementById('turbidity-value').textContent = "Error";
    document.getElementById('gps-value').textContent = "Error";
});

// --- Inicialización al Cargar el Contenido del DOM ---
document.addEventListener('DOMContentLoaded', () => {
    initMap(); // Inicializar el mapa cuando la página se cargue
    // No necesitamos setInterval aquí, ya que el servidor envía los datos a través de WebSockets
});