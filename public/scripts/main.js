// /public/scripts/main.js - Router ÚNICO y Optimizado

// --- Módulos Esenciales (DEBEN SER MÓDULOS ES) ---
import { loadLocalData, saveLocalData } from './utils/localPersistence.js';
import { handleLogin } from './components/appEvents.js'; 
import { initSocket, sendMessage } from './services/websocketService.js';
import { initChatPage } from './components/chatEvents.js'; 
import { initRankPage } from './components/rankEvents.js'; 

let userData = loadLocalData();
let isChatInitialized = false; 

// ===============================================
// 1. MANEJO DE VISTAS Y HASH ROUTING
// ===============================================

function showView(viewName) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.add('hidden');
        view.classList.remove('active');
    });

    const targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active');

        // Inicializar la lógica solo cuando la vista se activa
        if (viewName === 'chat' && !isChatInitialized) {
            console.log("[Router] Inicializando conexión WS para Chat.");
            initChatPage(initSocket, sendMessage); 
            isChatInitialized = true;
        } else if (viewName === 'rank') {
            initRankPage(initSocket); 
        }
    }
}

function handleHashChange() {
    // Por defecto es 'chat' si ya está logueado, o 'login' si no lo está.
    const hash = window.location.hash.slice(1) || 'chat'; 
    
    if (!userData || !userData.username) {
        showView('login');
    } else {
        showView(hash);
    }
    
    // Actualizar clase 'active' en el menú de navegación
    document.querySelectorAll('#navigation a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === '#' + hash) {
            a.classList.add('active');
        }
    });
}

// ===============================================
// 2. LÓGICA DE LOGIN (SPA)
// ===============================================
function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const username = document.getElementById('username').value;
        
        // ... (deshabilitar formulario) ...

        const success = await handleLogin(username, null, saveLocalData, initSocket);
        
        // ... (habilitar formulario) ...

        // CRÍTICO: Si es exitoso, actualiza userData y llama al router
        if (success) {
            userData = loadLocalData(); 
            window.location.hash = '#chat'; // Redirige el hash, activa showView('chat')
        }
    });
}

// ===============================================
// 3. BOOTSTRAP DE LA APLICACIÓN
// ===============================================
function bootstrapApp() {
    window.addEventListener('hashchange', handleHashChange);
    initializeLoginPage();

    // Decide qué mostrar al iniciar (login o chat)
    if (userData && userData.username) {
        handleHashChange(); 
    } else {
        showView('login');
    }
}

document.addEventListener('DOMContentLoaded', bootstrapApp);