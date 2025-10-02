// main.js - El Orquestador de la Aplicación
// Importamos solo las funciones de inicialización de los módulos
import { loadLocalData, saveLocalData } from './utils/localPersistence.js';
import { requestPermission } from './utils/notifications.js';
import { initSocket, sendMessage } from './core/socket.js';
import { handleLogin, handleMessageInput } from './components/appEvents.js';

// --- ELEMENTOS CLAVE ---
const loginButton = document.getElementById('login-button');
const messageInput = document.getElementById('message-input');
const loginContainer = document.getElementById('login-container');
const mainChat = document.getElementById('main-chat');


// --- FUNCIÓN DE ARRANQUE PRINCIPAL ---

function bootstrapApp() {
    console.log("Iniciando aplicación modular y optimizada...");
    
    // 1. Inicializar Utilitarios
    requestPermission(); // Solicita permisos de notificaciones.

    // 2. Intentar Cargar Datos y Auto-Login
    const userData = loadLocalData();
    
    if (userData && userData.username) {
        // Si hay datos guardados, saltamos el formulario
        loginContainer.classList.add('hidden');
        mainChat.classList.remove('hidden');
        
        // Iniciamos el socket, que enviará el 'join' automáticamente.
        initSocket(userData); 

    } else {
        // Mostrar la pantalla de login y adjuntar eventos
        loginButton.addEventListener('click', () => handleLogin(saveLocalData, initSocket));
        
        // Si no hay datos, mostramos login y esperamos la acción del usuario.
        loginContainer.classList.remove('hidden');
    }

    // 3. Conectar la UI al Socket (Eventos de Chat)
    // Esto asegura que al presionar ENTER o el botón, se llame al módulo correcto
    messageInput.addEventListener('keypress', (e) => handleMessageInput(e, sendMessage));
}

// CRÍTICO: Ejecutar la función de arranque solo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', bootstrapApp);

// Exportar funciones si se necesitan externamente (ej: en pruebas)
export { bootstrapApp };