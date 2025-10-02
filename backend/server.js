// server.js - Versión FINAL con Perfiles, Multer (Multimedia) y Socket.io

const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const multer = require("multer"); // Para manejo eficiente de archivos binarios

// --- Configuración Inicial y Puerto ---
// 1. Inicializa 'app' (Instancia de Express) PRIMERO
const app = express(); 
// 2. Ahora sí puedes usar 'app' para crear el servidor HTTP
const server = http.createServer(app); 
// 3. Inicializa Socket.io usando el servidor HTTP
const io = socketio(server);

const PORT = process.env.PORT || 3000;

// --- 1. Configuración de Multer para Subida de Fotos ---
// Almacenamiento en disco para las fotos de perfil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // La carpeta 'uploads' DEBE existir en la raíz del proyecto
        cb(null, path.join(__dirname, '..', 'uploads')); 
    },
    filename: (req, file, cb) => {
        // Nombre de archivo único (timestamp + nombre original)
        cb(null, Date.now() + '-' + file.originalname.toLowerCase().split(' ').join('-'));
    }
});
const upload = multer({ storage: storage });

// --- 2. Almacén Central de Usuarios Conectados ---
// Almacena el perfil completo, indexado por el ID ÚNICO (no el socket.id volátil)
const connectedUsers = {}; 

// --- 3. Middlewares de Express y Archivos Estáticos ---
// Sirve la carpeta 'public' (login.html, chat.html, perfil.html)
app.use(express.static(path.join(__dirname, '..', 'public')));
// Sirve la carpeta 'uploads' para que las fotos sean accesibles por URL
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'))); 

// Middleware para redirigir al login si se accede a la raíz y no hay sesión/datos (simulado con el login.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});


// --- 4. Ruta de API REST para Subida de Fotos (FETCH API) ---
// Punto clave de optimización: Multer maneja el binario de forma eficiente.
app.post('/upload-photo', upload.single('profilePhoto'), (req, res) => {
    if (req.file) {
        // Devolver la URL pública del archivo: /uploads/nombre-del-archivo.jpg
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ success: true, url: fileUrl });
    } else {
        res.status(400).json({ success: false, message: "No se subió el archivo o el campo es incorrecto." });
    }
});


// --------------------------------------------------
// 5. Lógica de Socket.io (Tiempo Real)
// --------------------------------------------------
io.on("connection", (socket) => {
    
    let currentUserID; // El ID de perfil único (ej: "001")

    // --- JOINS: El cliente envía su perfil completo desde localStorage ---
    socket.on("join", (perfil) => {
        currentUserID = perfil.id;
        
        // Asocia el socket.id actual con el ID de perfil único
        connectedUsers[perfil.id] = { ...perfil, socketId: socket.id }; 

        console.log(`[JOIN] ${perfil.nombre} (${perfil.rango}) conectado. ID: ${currentUserID}`);
        
        // Mensaje de estado al resto
        socket.broadcast.emit("server_message", { 
            texto: `${perfil.nombre} se ha unido al chat.`, 
            tipo: 'status' 
        });
        
        // Actualiza la lista de usuarios para todos
        io.emit("update_users", Object.values(connectedUsers));
    });

    // --- PROFILE UPDATE: El usuario guardó cambios en perfil.html ---
    socket.on("profile_update", (updatedPerfil) => {
        if (connectedUsers[updatedPerfil.id]) {
            // Actualizar el perfil en el almacén del servidor
            connectedUsers[updatedPerfil.id] = { 
                ...connectedUsers[updatedPerfil.id], 
                ...updatedPerfil 
            };
            
            // Notificar a todos sobre la actualización del perfil
            io.emit("server_message", { 
                texto: `${updatedPerfil.nombre} ha actualizado su perfil.`, 
                tipo: 'status' 
            });
            
            // Reenviar la lista actualizada de usuarios
            io.emit("update_users", Object.values(connectedUsers));
        }
    });

    // --- MENSAJES ---
    socket.on("mensaje", (data) => {
        const remitente = connectedUsers[currentUserID];
        if (!remitente) return; // Si no hay remitente válido, ignorar

        if (data.texto.startsWith('/')) {
            // Manejo de comandos por rango
            handleCommand(remitente, data.texto, io, socket.id);
        } else {
            // Reenvía el mensaje estándar a todos
            io.emit("mensaje", { 
                nombre: remitente.nombre, 
                rango: remitente.rango, 
                texto: data.texto, 
                foto: remitente.foto, 
                tipo: 'text' 
            });
        }
    });

    // --- DESCONEXIÓN ---
    socket.on("disconnect", () => {
        if (currentUserID && connectedUsers[currentUserID]) {
            const desconectado = connectedUsers[currentUserID];
            delete connectedUsers[currentUserID];
            
            socket.broadcast.emit("server_message", { 
                texto: `${desconectado.nombre} ha abandonado.`, 
                tipo: 'status' 
            });
            // Reenviar lista sin el usuario desconectado
            io.emit("update_users", Object.values(connectedUsers));
        }
    });
});


// --- Lógica de Comandos (Implementación Simple) ---
function handleCommand(user, fullCommand, io, socketId) {
    const isAdmin = user.rango === 'Fundador' || user.rango === 'Líder';
    let responseText = `Comando '${fullCommand.split(' ')[0]}' no reconocido o no tienes permiso.`;

    if (fullCommand.startsWith('/help')) {
        responseText = `Comandos disponibles: /help, /me. (Administración: /ban, /kick si eres Fundador/Líder).`;
    } else if (fullCommand.startsWith('/me')) {
        const action = fullCommand.substring(4).trim();
        // Emite una acción a todos (ej: *Oliver Doldán está durmiendo*)
        io.emit("server_message", { 
            texto: `*${user.nombre} ${action}*`, 
            tipo: 'system' 
        });
        return; // No enviar mensaje al usuario local
    } else if ((fullCommand.startsWith('/ban') || fullCommand.startsWith('/kick')) && isAdmin) {
        responseText = `[ADMIN - ${user.rango}] Ejecutando acción administrativa para: ${fullCommand.substring(5).trim() || 'usuario no especificado'}.`;
    }

    // Envía la respuesta del sistema solo al usuario que ejecutó el comando
    io.to(socketId).emit("server_message", { 
        texto: responseText, 
        tipo: 'system' 
    });
}


// --- Arrancar el Servidor ---
server.listen(PORT, () => {
  console.log(`Servidor de Chat corriendo en http://localhost:${PORT}`);
});