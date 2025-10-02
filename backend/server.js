// /backend/server.js - Versión FINAL y Simplificada

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws'); 

// ************************************************
// 1. IMPORTACIÓN DEL MANEJADOR DE WS
// ************************************************
// Importamos desde el mismo directorio /backend/
const { setupWebSocketListeners } = require('./websocket'); 

// --- Inicialización ---
const app = express();
const server = http.createServer(app);
const PORT = 8080; 

// --- Middleware CRÍTICO ---
// Express sirve el contenido de la carpeta 'public' por defecto.
// Esto significa que:
//   - /login.html  =>  busca en public/login.html
//   - /styles/...  =>  busca en public/styles/...
app.use(express.static(path.join(__dirname, '../public'))); 


// ************************************************
// 2. RUTAS EXPRESS SIMPLIFICADAS
// ************************************************
// Ya que 'public' es la raíz estática, solo necesitamos redirigir a /login.html
// y /chat.html. Express automáticamente encuentra el archivo en 'public/'.

app.get('/', (req, res) => {
    // Redirige al archivo login.html que está en la raíz estática
    res.redirect('/login.html'); 
});

// Nota: Las rutas app.get('/login.html', ...) y app.get('/chat.html', ...)
// ya NO son estrictamente necesarias, pero si las tenías por seguridad o lógica:
/*
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/chat.html', (req, res) => {
    // La redirección del login lleva aquí
    res.sendFile(path.join(__dirname, '..', 'public', 'chat.html'));
});
*/


// ************************************************
// 3. INICIALIZACIÓN DEL SERVIDOR WS
// ************************************************
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('[WebSocket] Nuevo cliente conectado.');
    setupWebSocketListeners(ws, wss);
});


// ************************************************
// 4. ARRANQUE
// ************************************************
server.listen(PORT, () => {
    console.log(`Servidor HTTP y WS corriendo en http://localhost:${PORT}`);
});