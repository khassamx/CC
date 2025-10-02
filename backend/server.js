// /backend/server.js - Versión FINAL y COMPLETA para resolver Cannot GET /login.html

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws'); 

// --- CRÍTICO: Importación del WS ---
const { setupWebSocketListeners } = require('./websocket'); 

// --- Inicialización ---
const app = express();
const server = http.createServer(app);
const PORT = 8080; 

// --- 1. Middleware de Archivos Estáticos ---
// Sirve CSS, JS, imágenes, y todos los archivos HTML (excepto '/')
app.use(express.static(path.join(__dirname, '../public'))); 


// ************************************************
// 2. RUTAS EXPRESS DEFINITIVAS
// ************************************************

// Ruta Raíz: CRÍTICO - Forzamos el envío del login.html
// __dirname (backend) + '..' (sube a CC) + 'public' (entra a public) + 'login.html'
app.get('/', (req, res) => {
    console.log("[SERVER] Serviendo /login.html");
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Nota: Todas las demás rutas de HTML (/chat.html, /styles/...) son manejadas 
// por app.use(express.static) y funcionarán automáticamente porque están en 'public/'.


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