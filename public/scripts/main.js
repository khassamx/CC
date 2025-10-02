// main.js - El Orquestador Universal y Router de Frontend (Optimización Ultra Potente)

// --- Módulos Importados (Funciones de Inicialización) ---
// El orquestador importa la función de inicio de cada vista.
import { loadLocalData, saveLocalData } from './utils/localPersistence.js';
import { handleLogin } from './components/appEvents.js'; 
import { initSocket, sendMessage } from './services/websocketService.js';
// Suponemos que tienes módulos de inicialización para tus otras vistas:
import { initRankPage } from './components/rankEvents.js'; 
import { initProfilePage } from './components/profileEvents.js';

// --- Estado Global ---
let userData = loadLocalData();
let ws = null; // Instancia del WebSocket

// ===============================================
// LÓGICA DE INICIALIZACIÓN POR VISTA
// ===============================================

/**
 * Inicializa la página de Login (login.html).
 */
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (!loginForm) return; // Salir si el elemento no existe

    console.log("[Router] Activando Lógica de LOGIN.");

    // Pre-llenar campos (si aplica)
    if (userData && userData.username) {
        usernameInput.value = userData.username;
    }

    // CRÍTICO: Capturar el evento SUBMIT (tecla ENTER)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        if (loginForm.disabled) return; 
        loginForm.disabled = true;

        // Inicia el proceso de conexión y autenticación
        const success = await handleLogin(
            usernameInput.value, 
            passwordInput.value, 
            saveLocalData, 
            initSocket
        );
        
        loginForm.disabled = false;

        if (success) {
            // Redirigir al chat si la autenticación es exitosa
            window.location.href = '/chat';
        }
    });
}

/**
 * Inicializa la página de Chat (chat.html).
 */
function initChatPage() {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    
    if (!chatContainer) return;

    console.log("[Router] Activando Lógica de CHAT.");
    
    // 1. Re-establecer la conexión WebSocket (asumiendo que initSocket maneja el auto-reconnect)
    ws = initSocket(); // La instancia WS se guarda para uso global

    // 2. Activar la escucha de mensajes
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                sendMessage(messageInput.value); 
                messageInput.value = '';
            }
        });
    }
}


// ===============================================
// FUNCIÓN PRINCIPAL DE RUTEO (bootstrapApp)
// ===============================================

function bootstrapApp() {
    // 1. Obtener la ruta actual (ej: /login, /chat, /rank)
    const currentPath = window.location.pathname.toLowerCase();
    
    console.log(`[APP] Iniciando en ruta: ${currentPath}`);

    // 2. Usar un switch (más rápido que múltiples if/else) para llamar a la función específica
    if (currentPath.includes('/login')) {
        initLoginPage();
    } else if (currentPath.includes('/chat')) {
        initChatPage();
    } else if (currentPath.includes('/rank')) {
        // Lógica de Rank (ejecutaría initRankPage() de rankEvents.js)
        initRankPage();
    } else if (currentPath.includes('/profile')) {
        // Lógica de Perfil (ejecutaría initProfilePage() de profileEvents.js)
        initProfilePage();
    }
    // No se necesita lógica para /, ya que el backend nos redirige.
    // No se necesita lógica para /error, ya que es una página estática.
}

// Iniciar el enrutador una vez que el DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', bootstrapApp);