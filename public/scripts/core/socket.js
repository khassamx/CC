import { WS_URL } from '../utils/constants.js';

const socket = new WebSocket(WS_URL);
let messageHandler = {};

export const initSocket = (handler) => {
    // Este manejador sería el 'main.js' o un 'dispatcher'
    messageHandler = handler; 

    socket.onopen = () => console.log('Socket conectado.');
    socket.onerror = (e) => console.error('Socket error:', e);
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // Aquí se llamaría a las funciones de UI (ej: messageList.handleIncoming)
        console.log('Mensaje recibido:', message.type);
    };
};

export const sendMessage = (message) => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
};