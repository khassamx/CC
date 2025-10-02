// /backend/server.js - Versión FINAL y COMPLETA para resolver ERR_MODULE_NOT_FOUND

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws'); 

// --- CRÍTICO: Importación del WS (Debe estar en CJS) ---
const { setupWebSocketListeners } = require('./websocket'); 

// --- Inicialización ---
const app = express();
const server = http.createServer(app);
const PORT = 8080; 

// --- 1. Middleware de Archivos Estáticos ---
// La carpeta 'public' se convierte en la raíz del servidor para archivos estáticos.
app.use(express.static(path.join(__dirname, '../public'))); 


// --- 2. Rutas Express Simplificadas ---
// Forzamos el envío de la página única, que debe ser index.html o app.html.
// Asumo que tu SPA unificada se llama index.html (o la que hayas elegido).
app.get('/', (req, res) => {
    // Asegúrate de que index.html o app.html esté en /public/
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Si usas login.html como la SPA unificada:
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});


// --- 3. Inicialización del Servidor WS ---
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('[WebSocket] Nuevo cliente conectado.');
    setupWebSocketListeners(ws, wss);
});


// --- 4. Arranque ---
server.listen(PORT, () => {
    console.log(`Servidor HTTP y WS corriendo en http://localhost:${PORT}`);
});