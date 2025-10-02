// /public/scripts/main.js - Router ÚNICO y Optimizado (SPA)

import { loadLocalData, saveLocalData } from './utils/localPersistence.js';
import { handleLogin } from './components/appEvents.js'; // Maneja la autenticación con el servidor
import { initSocket, sendMessage } from './services/websocketService.js';
import { initChatPage, displayChatMessage } from './components/chatEvents.js'; 
import { initRankPage } from './components/rankEvents.js'; 

let userData = loadLocalData();
let isChatInitialized = false; 
let loginTimeout = null; // Para el ingreso automático

// ===============================================
// 1. MANEJO DE VISTAS (SPA)
// ===============================================

function showView(viewName) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });

    const targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        targetView.classList.add('active');
        targetView.classList.remove('hidden');

        // Inicializar la lógica
        if (viewName === 'chat' && !isChatInitialized) {
            // Pasamos la función de renderizado avanzado de mensajes al chat
            initChatPage(initSocket, sendMessage, displayChatMessage); 
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
        // Aseguramos que la navegación solo sea entre chat y rank
        const validViews = ['chat', 'rank', 'profile'];
        showView(validViews.includes(hash) ? hash : 'chat');
    }
}

// ===============================================
// 2. LÓGICA DE LOGIN AUTOMÁTICO
// ===============================================

async function attemptLogin(username) {
    if (!username || username.length < 3) return; 

    // Se asume que el backend maneja la verificación de mayúsculas/minúsculas
    const success = await handleLogin(username, null, saveLocalData, initSocket);
    
    if (success) {
        userData = loadLocalData(); 
        // Mostrar el alias en el header del chat
        document.getElementById('user-alias').textContent = userData.chatname; 
        
        window.location.hash = '#chat'; // Cambia la vista inmediatamente
    } else {
        alert("Usuario no válido. Por favor, intenta de nuevo.");
    }
}

function initializeLoginPage() {
    const usernameInput = document.getElementById('username');
    if (!usernameInput) return;

    // ➡️ INICIO DE SESIÓN AUTOMÁTICO AL ESCRIBIR
    usernameInput.addEventListener('input', () => {
        // Limpiar el timeout anterior si el usuario sigue escribiendo
        clearTimeout(loginTimeout); 
        
        // Iniciar un nuevo timeout para intentar el login después de 1 segundo de pausa
        loginTimeout = setTimeout(() => {
            attemptLogin(usernameInput.value);
        }, 1000); 
    });

    // Prevenir el envío de formulario con ENTER (ya que es automático)
    document.getElementById('login-form').addEventListener('submit', (e) => e.preventDefault());
}

// ===============================================
// 3. BOOTSTRAP
// ===============================================
function bootstrapApp() {
    window.addEventListener('hashchange', handleHashChange);
    initializeLoginPage();

    // Iniciar en la vista correcta (Chat si ya está logueado, sino Login)
    if (userData && userData.username) {
        handleHashChange(); // Carga el chat si hay datos
    } else {
        showView('login');
    }
    
    // Inicializar listeners de navegación
    document.getElementById('navigation').addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            // El hashchange se encargará de llamar a showView
            window.location.hash = e.target.getAttribute('href'); 
            e.preventDefault();
        }
    });
}

document.addEventListener('DOMContentLoaded', bootstrapApp);