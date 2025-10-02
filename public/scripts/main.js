// main.js - El Orquestador de la Aplicación
// ... (imports)

// --- ELEMENTOS CLAVE ---
// Eliminamos la referencia a loginButton
const messageInput = document.getElementById('message-input');
const loginContainer = document.getElementById('login-container');
const mainChat = document.getElementById('main-chat');
const passwordInput = document.getElementById('password'); // Necesitamos este

// --- FUNCIÓN DE ARRANQUE PRINCIPAL ---
function bootstrapApp() {
    console.log("Iniciando aplicación modular...");
    
    // ... (Lógica de loadLocalData e initSocket, etc.)

    // 3. Conectar la UI al Socket (Eventos de Login y Chat)
    
    // Si la aplicación está en la pantalla de login:
    if (loginContainer && !loginContainer.classList.contains('hidden')) {
        // ⬅️ CRÍTICO: ADJUNTAR EVENTO A LA TECLA ENTER
        // Aseguramos que el login se dispare al presionar Enter en cualquier input
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Evitar envío de formulario HTML
                handleLogin(saveLocalData, initSocket); 
            }
        });
        
        // También puedes adjuntarlo al input de usuario para mayor comodidad
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                passwordInput.focus(); // Mover al campo de contraseña
            }
        });
    }

    // Evento de chat (sigue igual)
    messageInput.addEventListener('keypress', (e) => handleMessageInput(e, sendMessage));
}

// ... (El resto del main.js)