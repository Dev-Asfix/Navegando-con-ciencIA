// app.js

const express = require('express');
const http = require('http'); // Necesario para Socket.IO
const socketIo = require('socket.io');
const cors = require('cors'); // Para permitir conexiones desde el frontend

const app = express();
// Creamos un servidor HTTP a partir de la aplicación Express
const server = http.createServer(app);
// Configuramos Socket.IO para trabajar con nuestro servidor HTTP
const io = socketIo(server, {
    cors: {
        origin: "*", // Permite conexiones desde cualquier origen (ajusta para producción)
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Habilita CORS para todas las solicitudes (importante para el desarrollo cross-origin)
app.use(cors());

// Sirve archivos estáticos desde la carpeta 'public'
// Esto hará que 'public/index.html' sea accesible en la raíz '/'
// y 'public/style.css' como '/style.css', etc.
app.use(express.static('public'));

app.use(express.json()); // Para parsear cuerpos de solicitud JSON
app.use('/vers', express.static(__dirname + '/vers'));

// Sirve archivos estáticos desde la carpeta 'public' dentro de 'vers'
// Esto hará que 'tu_proyecto/vers/public/barco.glb' sea accesible como '/vers/public/barco.glb'
app.use('/vers/public', express.static(__dirname + '/vers/public'));


// Función para simular datos de sensores
function simularDatosSensor() {
    const ph = parseFloat((Math.random() * (8.5 - 7.5) + 7.5).toFixed(2)); // pH agua de mar 7.5-8.5
    const temperatura = parseFloat((Math.random() * (30 - 20) + 20).toFixed(2)); // Temperatura 20-30°C
    const turbidez = parseFloat((Math.random() * (100 - 10) + 10).toFixed(2)); // Turbidez 10-100 NTU
    // Coordenadas GPS simuladas cerca de Paita, Piura, con ligera variación
    const latBase = -5.0886; // Latitud base para Paita
    const lonBase = -81.1186; // Longitud base para Paita
    const latitud = parseFloat((latBase + (Math.random() - 0.5) * 0.01).toFixed(6));
    const longitud = parseFloat((lonBase + (Math.random() - 0.5) * 0.01).toFixed(6));

    return {
        timestamp: new Date().toISOString(),
        pH: ph,
        temperatura: temperatura,
        turbidez: turbidez,
        latitud: latitud,
        longitud: longitud
    };
}

// Opcional: Endpoint REST para obtener los datos más recientes (puedes mantenerlo o quitarlo)
app.get('/api/sensor-data', (req, res) => {
    const data = simularDatosSensor();
    res.json(data);
});

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado vía WebSocket.');

    // Enviar datos simulados cada 10 segundos
    const interval = setInterval(() => {
        const data = simularDatosSensor();
        socket.emit('sensor_update', data); // 'sensor_update' es el nombre del evento
    }, 10000); // Envía datos cada 10 segundos

    socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado.');
        clearInterval(interval); // Limpia el intervalo cuando el cliente se desconecta
    });
});

// Este app.get('/') es principalmente un fallback, express.static('public') servirá index.html por defecto.
app.get('/', (req, res) => {
    res.send('API de simulación de sensores para "Navegando con CiencIA" está funcionando y los WebSockets están listos.');
});
// La ruta raíz '/' servirá tu index.html principal por defecto debido a express.static(__dirname)


// Iniciar el servidor HTTP
server.listen(PORT, () => {
    console.log(`Servidor Node.js (Express y Socket.IO) escuchando en http://localhost:${PORT}`);
    console.log(`Puedes ver tu aplicación en: http://localhost:${PORT}`);
    console.log(`La API REST (si la usas) está en: http://localhost:${PORT}/api/sensor-data`);
    console.log(`Los WebSockets están activos en ws://localhost:${PORT}`);
});