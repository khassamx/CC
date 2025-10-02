const express = require('express');
const http = require('http');
const path = require('path');
const { initWebSocketServer } = require('./websocket');
const { connectDB } = require('./config/db');
const { configureSession } = require('./config/session'); // ¡NUEVO!
const mainRouter = require('./routes/index'); // ¡NUEVO!
const { PORT } = require('./config/constants');

const app = express();
const server = http.createServer(app);

// 1. Conexión de la Base de Datos
connectDB();

// 2. Configuración de Sesiones
app.use(configureSession());

// 3. Middlewares de Archivos Estáticos
app.use(express.static(path.join(__dirname, '../public')));

// 4. Conectar el Enrutador
// Todas las rutas (/, /chat, /login, etc.) se manejan ahora en routes/index.js
app.use('/', mainRouter); 

// 5. Inicialización del Servidor WebSocket
initWebSocketServer(server);

// 6. Arranque del Servidor
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});