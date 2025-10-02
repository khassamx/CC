// /backend/websocket.js (Lógica de Manejo de Conexiones)
const userService = require('./services/userService');

// Suponiendo que esta es la función principal que maneja los mensajes entrantes
ws.on('message', async (message) => {
    try {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            const { username } = data.data; 
            
            // Llama al servicio que ya no usa contraseña
            const authResult = await userService.authenticateUser(username);

            if (authResult.success) {
                // 1. Guardar la sesión en el socket (vital para el chat)
                ws.user = authResult.user; 

                // 2. ENVIAR LA SEÑAL DE ÉXITO (CRÍTICO)
                ws.send(JSON.stringify({
                    type: 'auth_success',
                    chatname: authResult.user.chatname,
                    rank: authResult.user.rank
                }));
                
                // NOTA: No cierres el socket aquí. La redirección lo cerrará del lado del cliente.
                console.log(`[AUTH OK] Usuario ${username} autenticado. Señal enviada.`);

            } else {
                // Enviar error
                ws.send(JSON.stringify({ type: 'auth_error', message: 'Fallo al encontrar/crear usuario.' }));
            }
        } 
        // ... (El resto de la lógica para 'chat_message', 'rejoin', etc.)
    } catch (e) {
        console.error("Error al parsear mensaje WS:", e);
    }
});