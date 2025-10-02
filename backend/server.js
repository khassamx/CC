// server.js - Chat Real con Socket.io

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const PORT = 3000;

// Almacén de usuarios (para lista y rangos)
const connectedUsers = {}; 

// Servir archivos estáticos (login.html, chat.html, css, js)
app.use(express.static(path.join(__dirname, 'public'))); 

// --------------------------------------------------
// Lógica de Socket.io (Manejo de tiempo real, comandos, etc.)
// --------------------------------------------------
io.on("connection", (socket) => {
    
    let currentUser; 

    // 1. Manejo de JOINS (Cuando el cliente se conecta y envía sus datos de URL)
    socket.on("join", (userData) => {
        currentUser = { id: socket.id, usuario: userData.usuario, rango: userData.rango };
        connectedUsers[socket.id] = currentUser;

        console.log(`[JOIN] ${currentUser.usuario} (${currentUser.rango}) conectado.`);
        
        socket.broadcast.emit("server_message", { 
            texto: `${currentUser.usuario} se ha unido.`, 
            tipo: 'status' 
        });
        
        io.emit("update_users", Object.values(connectedUsers));
    });

    // 2. Manejo de MENSAJES (Texto, Comandos, Media)
    socket.on("mensaje", (data) => {
        const remitente = connectedUsers[socket.id];
        if (!remitente) return;

        if (data.texto.startsWith('/')) {
            // Aquí iría la lógica de comandos por rango
            handleCommand(remitente, data.texto, io);
        } else {
            // Emite el mensaje real
            io.emit("mensaje", { 
                usuario: remitente.usuario, 
                rango: remitente.rango, 
                texto: data.texto, 
                tipo: data.tipo || 'text', // Soporte para 'text', 'media'
                url: data.url,
                mimeType: data.mimeType
            });
        }
    });

    // 3. Desconexión
    socket.on("disconnect", () => {
        if (currentUser) {
            delete connectedUsers[socket.id];
            socket.broadcast.emit("server_message", { 
                texto: `${currentUser.usuario} ha abandonado.`, 
                tipo: 'status' 
            });
            io.emit("update_users", Object.values(connectedUsers));
        }
    });
});

// Función básica de ejemplo para comandos
function handleCommand(user, fullCommand, io) {
    const isAdmin = user.rango === 'Fundador' || user.rango === 'Líder';
    let responseText = `Comando '${fullCommand}' no reconocido.`;

    if (fullCommand.startsWith('/ban') && isAdmin) {
        responseText = `[ADMIN] ${user.usuario} ha ejecutado BAN.`;
    } else if (fullCommand.startsWith('/help')) {
        responseText = `Comandos: /help, /ban (si eres Líder).`;
    }

    io.to(user.id).emit("server_message", { 
        texto: responseText, 
        tipo: 'system' 
    });
}
// --------------------------------------------------

http.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});