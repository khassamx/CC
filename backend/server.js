// server.js - Versión 2.0 (Socket.io Avanzado)

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path"); // Necesario para rutas estáticas
const PORT = 3000;

// Almacén central de usuarios (temporal, se actualizará al conectar/desconectar)
const connectedUsers = {}; 

// Servir archivos estáticos (login.html, chat.html, css, js)
app.use(express.static(path.join(__dirname, 'public'))); // Usaremos una carpeta 'public' para buena práctica

// CRÍTICO: Servir el archivo principal de la SPA (login.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


// Lógica de Socket.io
io.on("connection", (socket) => {
    
    let currentUser; // Para rastrear al usuario en esta conexión

    // 1. Manejo de JOINS (El cliente se une y envía sus datos)
    socket.on("join", (userData) => {
        currentUser = { id: socket.id, usuario: userData.usuario, rango: userData.rango };
        connectedUsers[socket.id] = currentUser;

        console.log(`[JOIN] ${currentUser.usuario} (${currentUser.rango}) conectado.`);
        
        // Notificar a todos sobre el nuevo usuario
        socket.broadcast.emit("server_message", { 
            texto: `${currentUser.usuario} se ha unido al chat.`, 
            tipo: 'status' 
        });
        
        // Enviar la lista actualizada a todos
        io.emit("update_users", Object.values(connectedUsers));
    });

    // 2. Manejo de MENSAJES y COMANDOS
    socket.on("mensaje", (data) => {
        const { texto } = data;
        const remitente = connectedUsers[socket.id];
        
        if (!remitente) return; // Si no está en la lista, ignorar

        if (texto.startsWith('/')) {
            // Lógica de comandos
            handleCommand(remitente, texto, io);
        } else {
            // Reenvía el mensaje estándar a todos
            io.emit("mensaje", { 
                usuario: remitente.usuario, 
                rango: remitente.rango, 
                texto: texto, 
                tipo: 'text' 
            });
        }
    });
    
    // 3. Manejo de ESCRITURA
    socket.on("typing", (isTyping) => {
        if (currentUser) {
            socket.broadcast.emit("typing", { usuario: currentUser.usuario, isTyping });
        }
    });

    // 4. Desconexión
    socket.on("disconnect", () => {
        if (currentUser) {
            delete connectedUsers[socket.id];
            
            console.log(`[DISCONNECT] ${currentUser.usuario} desconectado.`);

            // Notificar a todos
            socket.broadcast.emit("server_message", { 
                texto: `${currentUser.usuario} ha abandonado el chat.`, 
                tipo: 'status' 
            });
            
            // Enviar la lista actualizada a todos
            io.emit("update_users", Object.values(connectedUsers));
        }
    });
});

// Lógica de Comandos (muy básica)
function handleCommand(user, fullCommand, io) {
    const parts = fullCommand.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const target = parts[1]; // Posible objetivo del comando
    
    let responseText = '';

    if (command === 'help') {
        responseText = `Comandos disponibles: /help, /me. Comandos Admin (Líderes): /ban, /mute.`;
    } 
    else if (user.rango === 'Fundador' || user.rango === 'Líder') {
        // Comandos solo para Líderes
        if (command === 'ban' && target) {
            responseText = `[ADMIN] El usuario ${target} ha sido baneado. (Lógica no implementada)`;
        } else if (command === 'mute' && target) {
            responseText = `[ADMIN] El usuario ${target} ha sido silenciado. (Lógica no implementada)`;
        } else {
            responseText = `Comando de Admin no reconocido o incompleto.`;
        }
    } else {
        // Comando no permitido o no encontrado
        responseText = `Comando '${command}' no reconocido o no tienes permiso.`;
    }

    // Enviar respuesta de comando solo al usuario que lo ejecutó (privado)
    io.to(user.id).emit("server_message", { 
        texto: responseText, 
        tipo: 'system' 
    });
}


http.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});