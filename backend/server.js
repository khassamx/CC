// server.js - Versión FINAL con Perfiles y Multimedia

const express = require("express");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const multer = require("multer"); // Para manejo eficiente de archivos

const app = express();
const PORT = 3000;

// --- Configuración de Multer para guardar archivos ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Guardar archivos en la carpeta 'uploads' (debe existir en la raíz del proyecto)
        cb(null, path.join(__dirname, 'uploads')); 
    },
    filename: (req, file, cb) => {
        // Nombre del archivo basado en hora actual para evitar duplicados
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Almacén central de usuarios (temporal)
const connectedUsers = {}; 

// Servir archivos estáticos y la carpeta de subidas
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Ruta para acceder a las fotos

// Ruta de Subida de Perfil (Usada por perfil.html)
app.post('/upload-photo', upload.single('profilePhoto'), (req, res) => {
    if (req.file) {
        // Devolver la URL pública del archivo
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ success: true, url: fileUrl });
    } else {
        res.status(400).json({ success: false, message: "No se subió el archivo." });
    }
});

// --------------------------------------------------
// Lógica de Socket.io (Manejo de tiempo real, comandos, etc.)
// --------------------------------------------------
io.on("connection", (socket) => {
    
    let currentUserID; // Usaremos el ID único para rastrear

    // 1. Manejo de JOINS (El cliente se une con sus datos de perfil)
    socket.on("join", (perfil) => {
        currentUserID = perfil.id;
        connectedUsers[perfil.id] = { ...perfil, id: socket.id }; // Guardar datos de perfil y socket.id

        socket.broadcast.emit("server_message", { 
            texto: `${perfil.nombre} [${perfil.rango}] se ha unido.`, 
            tipo: 'status' 
        });
        
        io.emit("update_users", Object.values(connectedUsers).map(u => ({
             usuario: u.usuario, 
             nombre: u.nombre, 
             rango: u.rango, 
             foto: u.foto // Enviar la foto para la lista de usuarios
        })));
    });

    // 2. Actualización de Perfil (Al guardar en perfil.html)
    socket.on("profile_update", (updatedPerfil) => {
        if (connectedUsers[updatedPerfil.id]) {
            // Actualizar el objeto de usuario en el servidor
            connectedUsers[updatedPerfil.id] = { 
                ...connectedUsers[updatedPerfil.id], 
                ...updatedPerfil 
            };
            
            // Notificar a todos que el perfil se actualizó (para que refresquen la lista)
            io.emit("server_message", { 
                texto: `${updatedPerfil.nombre} ha actualizado su perfil.`, 
                tipo: 'status' 
            });
            
            io.emit("update_users", Object.values(connectedUsers).map(u => ({
                usuario: u.usuario, 
                nombre: u.nombre, 
                rango: u.rango, 
                foto: u.foto
            })));
        }
    });

    // 3. Manejo de MENSAJES (Texto y Comandos)
    socket.on("mensaje", (data) => {
        const remitente = connectedUsers[currentUserID];
        if (!remitente) return;

        if (data.texto.startsWith('/')) {
            // Lógica de comandos aquí
            handleCommand(remitente, data.texto, io, socket.id);
        } else {
            // Reenvía el mensaje estándar a todos
            io.emit("mensaje", { 
                nombre: remitente.nombre, 
                rango: remitente.rango, 
                texto: data.texto, 
                foto: remitente.foto, // Enviar la foto actual
                tipo: 'text' 
            });
        }
    });

    // 4. Desconexión
    socket.on("disconnect", () => {
        if (currentUserID && connectedUsers[currentUserID]) {
            const desconectado = connectedUsers[currentUserID];
            delete connectedUsers[currentUserID];
            
            socket.broadcast.emit("server_message", { 
                texto: `${desconectado.nombre} ha abandonado.`, 
                tipo: 'status' 
            });
            io.emit("update_users", Object.values(connectedUsers).map(u => ({
                usuario: u.usuario, 
                nombre: u.nombre, 
                rango: u.rango, 
                foto: u.foto
            })));
        }
    });
});

// Lógica de Comandos (mantenida simple)
function handleCommand(user, fullCommand, io, socketId) {
    const isAdmin = user.rango === 'Fundador' || user.rango === 'Líder';
    let responseText = `Comando '${fullCommand}' no reconocido o no tienes permiso.`;

    if (fullCommand.startsWith('/help')) {
        responseText = `Comandos: /help, /admin (si eres Líder).`;
    } else if (fullCommand.startsWith('/admin') && isAdmin) {
        responseText = `[ADMIN] Acceso concedido, puedes usar /ban y /mute.`;
    }

    io.to(socketId).emit("server_message", { 
        texto: responseText, 
        tipo: 'system' 
    });
}

http.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});