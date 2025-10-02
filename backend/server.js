// /backend/server.js - Versión FINAL con Rutas de HTML en la carpeta 'public'

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

// --- Middleware ---
// CRÍTICO: Servir archivos estáticos (scripts, styles, etc.).
// Esto también sirve implícitamente todos los HTMLs que están en 'public/' 
// (como chat.html y login.html) cuando se acceden directamente (ej: /public/chat.html).
app.use(express.static(path.join(__dirname, '../public'))); 


// ************************************************
// 2. RUTAS EXPRESS (HTMLs AHORA ESTÁN EN PUBLIC)
// ************************************************
// Como los archivos HTML están en la carpeta que Express ya está sirviendo 
// como estáticos, SIMPLIFICAMOS las rutas para que Express las maneje automáticamente.

app.get('/', (req, res) => {
    // Redirige a la página de login (Express la encuentra en la carpeta estática)
    res.redirect('/login.html'); 
});

// Nota: Ya NO necesitamos app.get('/login.html', ...) ni app.get('/chat.html', ...) 
// porque Express los sirve automáticamente desde la carpeta estática.
// Si accedes a http://localhost:8080/login.html, Express busca el archivo en la raíz estática ('public/').

// SIN EMBARGO, si quieres proteger o asegurar la ruta, lo dejamos así:
app.get('/login.html', (req, res) => {
    // __dirname (backend) + '..' (sube a CC) + 'public' (entra a public) + 'login.html'
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/chat.html', (req, res) => {
    // La redirección del login lleva aquí
    res.sendFile(path.join(__dirname, '..', 'public', 'chat.html'));
});

app.get('/user_rank.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'user_rank.html'));
});

app.get('/user_profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'user_profile.html'));
});


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