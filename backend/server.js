// /public/scripts/main.js - Router ÚNICO y Optimizado (SPA)

import { loadLocalData, saveLocalData } from './utils/localPersistence.js';
import { handleLogin } from './components/appEvents.js'; 
import { initSocket, sendMessage } from './services/websocketService.js';
import { initChatPage } from './components/chatEvents.js'; 
import { initRankPage } from './components/rankEvents.js'; 

let userData = loadLocalData();
let isChatInitialized = false; // Bandera para evitar doble inicialización de WS

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
            initChatPage(initSocket, sendMessage); 
            isChatInitialized = true;
        } else if (viewName === 'rank') {
            initRankPage(initSocket); 
        }
    }
}

function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'chat'; // Por defecto es 'chat'
    
    if (!userData || !userData.username) {
        showView('login');
    } else {
        showView(hash);
    }
}

// ===============================================
// 2. LÓGICA DE LOGIN
// ===============================================
function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const username = document.getElementById('username').value;
        
        loginForm.disabled = true;

        const success = await handleLogin(username, null, saveLocalData, initSocket);
        
        loginForm.disabled = false;

        // CRÍTICO: Si es exitoso, actualiza userData y cambia la URL Hash
        if (success) {
            userData = loadLocalData(); // Recarga los datos guardados
            window.location.hash = '#chat'; // Cambia la URL y llama a handleHashChange
        }
    });
}

// ===============================================
// 3. BOOTSTRAP DE LA APLICACIÓN
// ===============================================
function bootstrapApp() {
    // Escuchar cambios de URL (navegación del menú o botón Atrás/Adelante)
    window.addEventListener('hashchange', handleHashChange);
    
    // Inicializar la lógica de login
    initializeLoginPage();

    // Iniciar la aplicación en la vista correcta
    if (userData && userData.username) {
        // Si ya está logueado, vamos directamente al chat (o al hash actual)
        handleHashChange(); 
    } else {
        // Si no está logueado, mostrar login
        showView('login');
    }
}

// Iniciar la aplicación.
document.addEventListener('DOMContentLoaded', bootstrapApp);