// /public/scripts/components/appEvents.js - El módulo que habla con el Servidor

// La función debe retornar TRUE/FALSE para que main.js pueda decidir si redirigir.
export function handleLogin(username, password, saveLocalData, initSocket) {
    // 1. Iniciar la conexión WebSocket (se inicia en el puerto actual)
    const ws = initSocket(); 
    
    // Devolvemos una Promesa para esperar de forma asíncrona la respuesta del servidor.
    return new Promise((resolve) => {
        // 2. Esperar a que el socket se abra
        ws.onopen = () => {
            console.log("[WS] Conectado. Enviando solicitud de Ingreso...");
            
            // 3. Enviar el mensaje de 'join' (autenticación)
            const payload = {
                type: 'join',
                data: {
                    username: username,
                    password: password // En este modo, será 'null' o 'no_pass' en el backend
                }
            };
            ws.send(JSON.stringify(payload));
        };

        // 4. Esperar la respuesta del servidor (el "OK")
        ws.onmessage = (event) => {
            const response = JSON.parse(event.data);

            if (response.type === 'auth_success') {
                console.log("[AUTH] Ingreso correcto. Preparando redirección...");
                // Guardamos los datos de sesión mínimos
                saveLocalData({ 
                    username: username, 
                    chatname: response.chatname, 
                    rank: response.rank 
                });
                
                ws.close(); // Cerramos esta conexión (la cerramos para que chat.html la reabra)
                resolve(true); // ⬅️ ¡OK! Enviamos la verificación al main.js
            } 
            
            else if (response.type === 'auth_error') {
                alert(`Fallo en el sistema de Ingreso: ${response.message}`);
                ws.close();
                resolve(false); // Falla
            }
        };

        ws.onerror = (e) => {
            console.error("Fallo de conexión WS:", e);
            resolve(false);
        };
        
        // Timeout para evitar que se quede esperando si el servidor no responde
        setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
                 ws.close();
                 resolve(false);
            }
        }, 5000); 
    });
}