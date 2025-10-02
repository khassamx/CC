const WebSocket = require('ws');
const authController = require('./controllers/authController');
// ... importar otros controllers (chatController, modController, etc.)

const connectedClients = new Map(); // Mapa para WS connections

exports.broadcast = (message) => {
    const messageString = JSON.stringify(message);
    connectedClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageString);
        }
    });
};

exports.initWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const userId = Date.now();
        ws.userId = userId;
        connectedClients.set(userId, ws);

        // Cargar historial
        // ... (Llamar a historyService para cargar historial)

        ws.on('message', (message) => {
            const incoming = JSON.parse(message.toString());
            const handler = connectedClients.get(userId);

            if (incoming.type === 'join') {
                authController.handleJoin(ws, incoming.data);
            }
            // ... (Llamar a otros controllers: chatController, modController, etc.)
        });

        ws.on('close', () => {
            connectedClients.delete(userId);
            // ... (Llamar a authController.handleLeave)
        });
    });
};