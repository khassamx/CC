// /backend/websocket.js - Manejador de eventos para CADA conexión

const userService = require('./services/userService');
// Importa el resto de tus servicios si los necesitas (ej: chatService)

/**
 * Función que configura los listeners para una nueva conexión WebSocket (ws).
 * @param {WebSocket} ws - La instancia de la conexión individual.
 * @param {WebSocket.Server} wss - La instancia del servidor WebSocket (opcional, para broadcast).
 */
function setupWebSocketListeners(ws, wss) {
    // 1. Manejo de mensajes entrantes (lo que estaba dando error)
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'join') {
                const { username } = data.data; 
                
                const authResult = await userService.authenticateUser(username);

                if (authResult.success) {
                    ws.user = authResult.user; 
                    
                    ws.send(JSON.stringify({
                        type: 'auth_success',
                        chatname: authResult.user.chatname,
                        rank: authResult.user.rank
                    }));
                    // Opcional: Notificar a todos los usuarios
                    // broadcast(wss, `${username} se ha unido al chat.`); 
                } else {
                    ws.send(JSON.stringify({ type: 'auth_error', message: 'Autenticación fallida.' }));
                }
            } 
            // 2. Aquí va la lógica para 'chat_message', 'rejoin', etc.
            // else if (data.type === 'chat_message') { ... }

        } catch (e) {
            console.error("Error al procesar mensaje WS:", e);
        }
    });

    // 3. Manejo de cierre de conexión
    ws.on('close', () => {
        if (ws.user) {
            console.log(`Usuario ${ws.user.username} desconectado.`);
            // Opcional: Notificar a todos.
            // broadcast(wss, `${ws.user.username} ha salido.`); 
        }
    });

    // 4. Manejo de errores
    ws.on('error', (error) => {
        console.error(`Error en el socket para ${ws.user?.username || 'un usuario'}:`, error);
    });
}

// Exportamos la función principal para que el server.js la use.
module.exports = { setupWebSocketListeners };