// /backend/server.js - Orquestador COMPLETO

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws'); // Necesario para el servidor WS

// ************************************************
// 1. CORRECCIÓN DE RUTA COBOL (CJS require)
// ************************************************
// Asumimos que websocket.js está en el mismo directorio (/backend/)
const { setupWebSocketListeners } = require('./websocket'); 

// --- Inicialización ---
const app = express();
const server = http.createServer(app);
const PORT = 8080; 

// --- Configuración de la Base de Datos (Asumimos que la tienes) ---
// const connectDB = require('./db/connection'); 
// (Asegúrate de que esta conexión a MongoDB esté operativa)

// --- Middleware y Servir Archivos Estáticos ---
// Sirve la carpeta 'public' para scripts y CSS
app.use(express.static(path.join(__dirname, '../public'))); 
// Usamos '../public' porque estamos dentro de 'backend/'

// ************************************************
// 2. RUTAS EXPRESS (HTML)
// ************************************************
// Las rutas son la razón por la que el navegador sabe a dónde ir

// Ruta Raíz: Siempre redirige al login si no hay sesión
app.get('/', (req, res) => {
    // Nota: Si no estás usando sesiones de Express (como 'express-session'), 
    // esta lógica debe ser simple: solo envía el login.
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Ruta de Login (principal)
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Ruta de Chat (protegida o principal del chat)
app.get('/chat.html', (req, res) => {
    // Aquí iría la lógica de verificación de sesión si existiera.
    res.sendFile(path.join(__dirname, '..', 'chat.html'));
});

// Ruta de Rank
app.get('/user_rank.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user_rank.html'));
});

// Ruta de Perfil
app.get('/user_profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user_profile.html'));
});


// ************************************************
// 3. INICIALIZACIÓN DEL SERVIDOR WS (WebSocket)
// ************************************************
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('[WebSocket] Nuevo cliente conectado.');
    
    // CRÍTICO: Configura los listeners del WS para esta conexión.
    setupWebSocketListeners(ws, wss);
});


// ************************************************
// 4. ARRANQUE DEL SERVIDOR
// ************************************************
server.listen(PORT, () => {
    console.log(`Servidor HTTP y WS corriendo en http://localhost:${PORT}`);
    // connectDB(); // Llama a la conexión de DB si la usas
});