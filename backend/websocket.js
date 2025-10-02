const WebSocket = require('ws');
const http = require('http'); // Necesario para crear la conexión WebSocket
const authController = require('./controllers/authController');
const chatController = require('./controllers/chatController');
// ... importar otros controllers y services

let wss;
const usersData = {}; // Almacenamiento rápido de usuarios conectados

/**
 * Inicializa el servidor WebSocket
 * @param {http.Server} httpServer - El servidor HTTP de Express.
 */
function initWebSocketServer(httpServer) {
    wss = new WebSocket.Server({ server: httpServer });
    
    wss.on('connection', (ws) => {
        const userId = Date.now(); // ID temporal para esta sesión
        console.log(`[WS] Cliente conectado. ID: ${userId}`);

        ws.on('message', (message) => {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join':
                    // Delega la autenticación y el registro de la conexión
                    authController.handleJoin(ws, data.data, usersData, userId);
                    break;
                case 'chat':
                    // Delega el manejo de mensajes normales
                    chatController.handleChatMessage(usersData[userId], data.data);
                    break;
                // ... otros casos (DM, comandos, etc.)
            }
        });

        ws.on('close', () => {
            // Lógica para manejar la desconexión
            console.log(`[WS] Cliente desconectado. ID: ${userId}`);
            delete usersData[userId];
            // Aquí iría el broadcast de la lista de usuarios actualizada
        });
    });
    
    console.log('[WS] WebSocket Server inicializado.');
}

/**
 * Envía un mensaje a todos los clientes conectados.
 */
function broadcast(message) {
    const data = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// ⬅️ EXPORTACIÓN CORREGIDA: Exportamos la función dentro de un objeto
module.exports = { 
    initWebSocketServer,
    broadcast 
};