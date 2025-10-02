import { loadLocalData } from './utils/localPersistence.js';
import { requestPermission } from './utils/notifications.js';
import { initSocket } from './core/socket.js';
import { handleLoginSubmit, handleMessageSend } from './components/appEvents.js';

// Esto simula la conexión de todos los componentes
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de utilidades
    loadLocalData();
    requestPermission();

    // 2. Inicializar la conexión y pasar callbacks (manejo de eventos WS)
    initSocket(); 

    // 3. Conectar la UI (event listeners)
    const usernameInput = document.getElementById('username');
    const messageInput = document.getElementById('message-input');

    usernameInput.addEventListener('change', handleLoginSubmit); // Simular intento de login
    messageInput.addEventListener('keypress', handleMessageSend);

    console.log("Frontend Modularizado cargado.");
});