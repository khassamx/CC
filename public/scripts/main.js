// /public/scripts/main.js - El Orquestador Universal (Máxima Optimización)

// --- Módulos Esenciales ---
// Siempre necesitamos utilidades y la lógica base de las páginas principales.
import { loadLocalData, saveLocalData } from './utils/localPersistence.js';
import { initSocket, sendMessage } from './services/websocketService.js';
import { handleLogin } from './components/appEvents.js'; // Lógica principal de Login/Auth

// --- Módulos Específicos (Carga bajo demanda) ---
// Estas funciones se importan, pero solo se llaman si la URL coincide.
import { initChatPage } from './components/chatEvents.js'; 
import { initRankPage } from './components/rankEvents.js'; 
import { initProfilePage } from './components/profileEvents.js';

// --- Control de Estado Global ---
let userData = loadLocalData();

// ===============================================
// LÓGICA DE INICIALIZACIÓN POR VISTA (Helpers)
// ===============================================

/**
 * Inicializa la página de Login (login.html).
 */
function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    
    if (!loginForm) return; 
    console.log("[Router] Activando Lógica de LOGIN y Autenticación Rápida.");

    // Pre-llenar campos si hay datos locales (solo el usuario)
    if (userData && userData.username) {
        usernameInput.value = userData.username;
    }

    // Capturar el evento SUBMIT (tecla ENTER) del formulario
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // ¡CRÍTICO! Evita que el navegador recargue.
        
        if (loginForm.disabled) return; 
        loginForm.disabled = true;

        // Inicia el proceso de conexión y autenticación (ahora sin contraseña en el frontend)
        const success = await handleLogin(
            usernameInput.value, 
            null, // La contraseña es ignorada en el modo de prueba del backend
            saveLocalData, 
            initSocket
        );
        
        loginForm.disabled = false;

        if (success) {
            // Si el backend autentica (o registra), redirigimos
            window.location.href = '/chat';
        }
    });
}

// ===============================================
// FUNCIÓN PRINCIPAL DE RUTEO
// ===============================================

function bootstrapApp() {
    // Obtener la ruta actual (ej: /login.html, /chat.html)
    const currentPath = window.location.pathname.toLowerCase();
    
    console.log(`[APP] Iniciando en ruta: ${currentPath}`);

    // Determinar qué código ejecutar basado en la URL
    if (currentPath.includes('/login.html')) {
        initializeLoginPage();
    } 
    
    else if (currentPath.includes('/chat.html')) {
        // Inicializa la lógica de conexión, UI de chat, y escucha de mensajes
        initChatPage(initSocket, sendMessage); 
    } 
    
    else if (currentPath.includes('/user_rank.html')) {
        // Inicializa la lógica de administración de rangos
        initRankPage(initSocket); 
    } 
    
    else if (currentPath.includes('/user_profile.html')) {
        // Inicializa la lógica de visualización y edición de perfil
        initProfilePage(initSocket); 
    }
    
    // Las páginas '/' y '/error.html' generalmente no necesitan JS activo
}

// Iniciar el enrutador una vez que el DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', bootstrapApp);