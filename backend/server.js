const express = require('express');
const http = require('http');
const path = require('path');
const { connectDB } = require('./config/db');
const { configureSession } = require('./config/session');
const mainRouter = require('./routes/index');
const { PORT } = require('./config/constants');

// ⬅️ IMPORTACIÓN CORREGIDA: Ahora importamos la función usando desestructuración
const { initWebSocketServer } = require('./websocket'); 

const app = express();
const server = http.createServer(app);

// 1. Conexión de la Base de Datos
connectDB();

// 2. Configuración de Sesiones
app.use(configureSession());

// 3. Middlewares de Archivos Estáticos
app.use(express.static(path.join(__dirname, '../public')));

// 4. Conectar el Enrutador
app.use('/', mainRouter); 

// 5. Inicialización del Servidor WebSocket
initWebSocketServer(server); // <--- AHORA SÍ ES UNA FUNCIÓN VÁLIDA

// 6. Arranque del Servidor
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});