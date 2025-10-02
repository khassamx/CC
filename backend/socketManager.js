// /backend/websocket.js (o donde manejes el socket)
const userService = require('./services/userService');

ws.on('message', async (message) => {
    const data = JSON.parse(message);

    if (data.type === 'join') {
        const { username } = data.data; 
        
        // 1. Autenticar usando el servicio
        const authResult = await userService.authenticateUser(username);

        if (authResult.success) {
            // 2. Guardar el usuario en la sesión del socket (CRÍTICO)
            ws.user = authResult.user; 

            // 3. Enviar la respuesta de éxito al Frontend
            ws.send(JSON.stringify({
                type: 'auth_success',
                chatname: authResult.user.chatname,
                rank: authResult.user.rank
            }));
            
            // ¡ESTO DESENCADENA LA REDIRECCIÓN EN EL FRONTEND!

        } else {
            // Enviar error
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Fallo al autenticar.' }));
        }
    } 
    // ... (el resto de la lógica de chat_message, rejoin, etc.)
});