// /public/scripts/main.js - Router Universal y Orquestador

// --- Módulos Esenciales (Deben existir) ---
import { loadLocalData, saveLocalData } from './utils/localPersistence.js';
import { handleLogin } from './components/appEvents.js'; 
import { initSocket, sendMessage } from './services/websocketService.js';
// Módulos Específicos para el Ruteo (pueden ser archivos vacíos por ahora)
import { initChatPage } from './components/chatEvents.js'; 
import { initRankPage } from './components/rankEvents.js'; 
import { initProfilePage } from './components/profileEvents.js';

let userData = loadLocalData();

// ===============================================
// LÓGICA DE LOGIN
// ===============================================
function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    
    if (!loginForm) return; 
    console.log("[Router] Activando Lógica de Login Rápido.");

    if (userData && userData.username) {
        usernameInput.value = userData.username;
    }

    // Listener de SUBMIT (Enter)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        if (loginForm.disabled) return; 
        loginForm.disabled = true;

        // Inicia el proceso de conexión. La contraseña es NULL.
        const success = await handleLogin(
            usernameInput.value, 
            null, // Contraseña se envía como null
            saveLocalData, 
            initSocket
        );
        
        loginForm.disabled = false;

        // Si el backend responde con éxito (true), redirigimos.
        if (success) {
            window.location.href = '/chat.html'; // Redirigir a /chat.html
        }
    });
}

// ===============================================
// FUNCIÓN PRINCIPAL DE RUTEO
// ===============================================
function bootstrapApp() {
    const currentPath = window.location.pathname.toLowerCase();
    
    console.log(`[APP] Iniciando en ruta: ${currentPath}`);

    if (currentPath.includes('/login.html')) {
        initializeLoginPage();
    } 
    
    else if (currentPath.includes('/chat.html')) {
        initChatPage(initSocket, sendMessage); 
    } 
    
    else if (currentPath.includes('/user_rank.html')) {
        initRankPage(initSocket); 
    } 
    
    else if (currentPath.includes('/user_profile.html')) {
        initProfilePage(initSocket); 
    }
}

// Iniciar el enrutador una vez que el DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', bootstrapApp);