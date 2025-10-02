// /backend/server.js - Versión Final con Rutas Corregidas

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws'); 
// Asumimos que la librería 'ws' está instalada: npm install ws

// ************************************************
// 1. IMPORTACIÓN DEL MANEJADOR DE WS
// ************************************************
// CRÍTICO: La corrección de la ruta, ya que websocket.js está en el mismo /backend/
const { setupWebSocketListeners } = require('./websocket'); 

// --- Inicialización ---
const app = express();
const server = http.createServer(app);
const PORT = 8080; 

// --- Middleware ---
// Sirve la carpeta 'public' para scripts, CSS e imágenes
// path.join(__dirname, '../public') nos lleva de /backend/ a /public/
app.use('/public', express.static(path.join(__dirname, '../public'))); 


// ************************************************
// 2. RUTAS EXPRESS (HTML en la Raíz)
// ************************************************
// La ruta '../' nos saca de la carpeta 'backend' a la raíz del proyecto (donde están los HTML)

app.get('/', (req, res) => {
    // Redirige a /login.html
    res.redirect('/login.html'); 
});

app.get('/login.html', (req, res) => {
    // Sirve el archivo login.html que está en la raíz
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/chat.html', (req, res) => {
    // Sirve el archivo chat.html que está en la raíz
    // Aquí es donde el login te redirige.
    res.sendFile(path.join(__dirname, '..', 'chat.html'));
});

// Rutas para otros archivos HTML en la raíz
app.get('/user_rank.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user_rank.html'));
});

app.get('/user_profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user_profile.html'));
});


// ************************************************
// 3. INICIALIZACIÓN DEL SERVIDOR WS
// ************************************************
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('[WebSocket] Nuevo cliente conectado.');
    
    // CRÍTICO: Configura los listeners del WS con la función importada.
    setupWebSocketListeners(ws, wss);
});


// ************************************************
// 4. ARRANQUE
// ************************************************
server.listen(PORT, () => {
    console.log(`Servidor HTTP y WS corriendo en http://localhost:${PORT}`);
    // Asegúrate de que la conexión a DB no falle aquí si la usas
});