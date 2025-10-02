// /public/scripts/main.js - Router Universal y Orquestador (Automático y Optimizado)

// --- Módulos Esenciales ---
import { loadLocalData, saveLocalData } from './utils/localPersistence.js';
import { handleLogin } from './components/appEvents.js'; 
import { initSocket, sendMessage } from './services/websocketService.js';
// Módulos Específicos para el Ruteo (Deben existir como archivos)
import { initChatPage } from './components/chatEvents.js'; 
import { initRankPage } from './components/rankEvents.js'; 
import { initProfilePage } from './components/profileEvents.js';

let userData = loadLocalData();

// ===============================================
// LÓGICA DE LOGIN (Ingreso Instantáneo)
// ===============================================
function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    
    if (!loginForm) return; 
    console.log("[Router] Login: Esperando ingreso (ENTER).");

    if (userData && userData.username) {
        usernameInput.value = userData.username;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        if (loginForm.disabled) return; 
        loginForm.disabled = true;

        // Inicia la lógica. Contraseña es NULL.
        const success = await handleLogin(
            usernameInput.value, 
            null, 
            saveLocalData, 
            initSocket
        );
        
        loginForm.disabled = false;

        // ⬅️ CRÍTICO: Redirección si la lógica devuelve TRUE (el "OK")
        if (success) {
            console.log("[REDIRECT] Verificación OK. Cargando chat.html...");
            window.location.href = '/chat.html'; 
        }
    });
}

// ===============================================
// FUNCIÓN PRINCIPAL DE RUTEO (Carga Automática de Todos los HTML)
// ===============================================
function bootstrapApp() {
    const currentPath = window.location.pathname.toLowerCase();
    
    console.log(`[APP] Cargando lógica automática para ruta: ${currentPath}`);

    // --- Switch para cargar la lógica específica de CADA HTML ---
    if (currentPath.includes('/login.html')) {
        initializeLoginPage();
    } 
    
    else if (currentPath.includes('/chat.html')) {
        // ✅ Carga automática del CHAT: Inicializa el socket y la UI
        initChatPage(initSocket, sendMessage); 
    } 
    
    else if (currentPath.includes('/user_rank.html')) {
        // ✅ Carga automática de RANKING
        initRankPage(initSocket); 
    } 
    
    else if (currentPath.includes('/user_profile.html')) {
        // ✅ Carga automática de PERFIL
        initProfilePage(initSocket); 
    }
    
    // 'error.html' no necesita JS
}

// Iniciar la aplicación.
document.addEventListener('DOMContentLoaded', bootstrapApp);