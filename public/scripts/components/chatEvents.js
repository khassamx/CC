// /public/scripts/components/chatEvents.js - Inicializa el chat al cargar la página

import { loadLocalData } from '../utils/localPersistence.js';

// --- Elementos de la UI del Chat (Asumimos que existen en chat.html) ---
const chatArea = document.getElementById('chat-messages');
const userList = document.getElementById('user-list');
const messageInput = document.getElementById('message-input');
const chatHeader = document.getElementById('chat-header'); // Para mostrar el nombre/rango

let ws = null;
let userData = loadLocalData();

/**
 * Función principal llamada por main.js al llegar a chat.html.
 * @param {Function} initSocket - Función para abrir la conexión WS.
 * @param {Function} sendMessage - Función para enviar mensajes (de websocketService.js).
 */
export function initChatPage(initSocket, sendMessage) {
    if (!userData || !userData.username) {
        // CRÍTICO: Si no hay datos de usuario, redirigimos al login
        window.location.href = '/login.html';
        return;
    }

    console.log("[ChatEvents] Inicializando chat para usuario:", userData.username);
    
    // 1. Mostrar información del usuario
    if (chatHeader) {
        chatHeader.textContent = `Bienvenido, ${userData.username} (${userData.rank})`;
    }

    // 2. Abrir la Conexión WebSocket
    ws = initSocket(); 
    
    // 3. Configurar los Listeners del WebSocket
    ws.onopen = () => {
        console.log("[WS] Conexión de Chat reestablecida y abierta.");
        
        // Al reabrir el socket, enviamos un mensaje de "re-join" para que el servidor 
        // sepa quiénes somos y nos envíe el historial de mensajes.
        ws.send(JSON.stringify({
            type: 'rejoin',
            data: { username: userData.username }
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data); // Función para manejar diferentes tipos de datos
    };

    ws.onerror = (error) => console.error("[WS Error] Error en la conexión de chat:", error);
    
    // 4. Configurar el input de mensaje (presionar Enter)
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                const text = messageInput.value.trim();
                if (text) {
                    // Llamamos a la función del servicio que envía el mensaje por el socket
                    sendMessage(text, userData.username, userData.rank); 
                    messageInput.value = '';
                }
            }
        });
    }
}

/**
 * Maneja los datos entrantes del servidor (mensajes, lista de usuarios, historial).
 */
function handleIncomingMessage(data) {
    switch (data.type) {
        case 'chat_message':
            displayMessage(data.message);
            break;
        case 'user_list':
            updateUserList(data.users);
            break;
        case 'history':
            data.messages.forEach(displayMessage);
            break;
        // ... otros casos (DM, comandos, etc.)
    }
}

/**
 * Añade un mensaje al área de chat (debes crear esta función en otro lugar o aquí).
 */
function displayMessage(message) {
    const msgElement = document.createElement('div');
    msgElement.className = 'chat-message';
    
    // Formato simple: [Rango] Nombre: Texto
    msgElement.innerHTML = `
        <span class="msg-rank">[${message.rank}]</span> 
        <span class="msg-name">${message.name}:</span> 
        <span class="msg-text">${message.text}</span>
    `;

    if (chatArea) {
        chatArea.appendChild(msgElement);
        chatArea.scrollTop = chatArea.scrollHeight; // Scroll automático
    }
}

/**
 * Actualiza la lista de usuarios conectados.
 */
function updateUserList(users) {
    if (userList) {
        userList.innerHTML = ''; // Limpiar lista
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = `${user.username} (${user.rank})`;
            userList.appendChild(li);
        });
    }
}