// /public/scripts/services/websocketService.js - El gestor del WebSocket

let wsInstance = null;
const WS_URL = `ws://localhost:8080`; // Asegúrate que el puerto sea el correcto

/**
 * Inicializa y retorna una única instancia del WebSocket.
 * Si ya hay una instancia, la retorna. Si está cerrada, crea una nueva.
 * @returns {WebSocket} La instancia del WebSocket.
 */
export function initSocket() {
    // 1. Si la instancia existe y está abierta o conectando, la retornamos (optimización).
    if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
        return wsInstance;
    }
    
    // 2. Si la instancia está cerrada o no existe, creamos una nueva.
    console.log("[WS Service] Conectando nuevo socket a:", WS_URL);
    wsInstance = new WebSocket(WS_URL);

    // 3. Devolvemos la nueva instancia. El código en appEvents.js o chatEvents.js
    //    se encargará de asignar los listeners (onopen, onmessage, etc.).
    return wsInstance;
}

/**
 * Envía un mensaje de chat al servidor.
 * @param {string} text - El texto del mensaje.
 * @param {string} username - El nombre de usuario que envía.
 * @param {string} rank - El rango del usuario.
 */
export function sendMessage(text, username, rank) {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
        console.error("[WS Service] Error: El socket no está abierto para enviar mensajes.");
        return;
    }

    const message = {
        type: 'chat_message',
        data: {
            text: text,
            name: username,
            rank: rank // Enviamos los datos del usuario para que el servidor los use
        }
    };
    
    wsInstance.send(JSON.stringify(message));
}