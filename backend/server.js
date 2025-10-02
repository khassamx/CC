const express = require('express');
const http = require('http');
const path = require('path');
const { initWebSocketServer } = require('./websocket');
const { connectDB } = require('./config/db');
const { PORT } = require('./config/constants');

const app = express();
const server = http.createServer(app);

// Conectar a la DB
connectDB();

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar el servidor WebSocket
initWebSocketServer(server);

server.listen(PORT, () => {
    console.log(`Servidor HTTP y WebSocket escuchando en http://localhost:${PORT}`);
});