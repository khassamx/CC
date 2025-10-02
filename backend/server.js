// backend/server.js (Ubicación: Dentro de la carpeta backend/)

const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

// --- RUTA CORREGIDA DEFINITIVA ---
// CRÍTICO: Sube un nivel (..) y entra en la carpeta 'src' para encontrar 'utils.js'
const { getRango } = require("../src/utils"); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000; // Asumo que usas el puerto 3000, aunque el navegador muestre 8080.

// --- CONFIGURACIÓN BASE ---
const rootDir = path.join(__dirname, '..'); // Directorio raíz (CC/)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos: public/ y uploads/
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// --- GESTIÓN DE ARCHIVOS (users.json) ---
// Asume que users.json está en el mismo nivel que server.js, dentro de backend/
const usersDataPath = path.join(__dirname, 'users.json');

function readUsers() {
    try {
        return JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
    } catch (e) {
        console.error("Error leyendo users.json. Creando archivo vacío.", e.message);
        return {};
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(usersDataPath, JSON.stringify(users, null, 4), 'utf8');
    } catch (e) {
        console.error("Error escribiendo users.json:", e);
    }
}

// --- ALMACÉN DE USUARIOS CONECTADOS ---
const connectedUsers = {};

// --- CONFIGURACIÓN SUBIDA DE ARCHIVOS (Multer) ---
const storage = multer.diskStorage({
    destination: path.join(rootDir, 'uploads'), 
    filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname.toLowerCase().replace(/\s/g, '-'))
});
const upload = multer({ storage });

// --- RUTA LOGIN CON CÁLCULO DE RANGO ---
app.post("/login", (req, res) => {
    const { usuario, password } = req.body;
    const users = readUsers();
    
    // Convertir a minúsculas para buscar en la base de datos
    const userKey = usuario.toLowerCase(); 

    if(users[userKey] && users[userKey].password === password){
        let userProfile = users[userKey];

        // Inicializar contador de mensajes si no existe
        if (typeof userProfile.mensajes !== 'number') {
            userProfile.mensajes = 0;
            writeUsers(users); 
        }
        
        // Calcular y agregar la información del rango
        const rangoInfo = getRango(userProfile.mensajes);
        userProfile.rango = rangoInfo.nombre; 
        userProfile.rangoCss = rangoInfo.cssClass; 
        userProfile.nivel = rangoInfo.nivel; 

        // Se envía el perfil completo, incluyendo el rango y la clase CSS
        res.json({ ok: true, user: { ...userProfile, usuario: userKey } });
    } else {
        res.status(401).json({ ok: false, message: "Usuario o contraseña incorrecta." });
    }
});

// --- RUTA SUBIR FOTO/VIDEO ---
app.post("/upload", upload.single("media"), (req,res) => {
    if (req.file) {
        const filePath = "/uploads/" + req.file.filename;
        res.json({ ok: true, path: filePath, mime: req.file.mimetype });
    } else {
        res.status(400).json({ ok: false, message: "Fallo al subir el archivo." });
    }
});

// --- SOCKET.IO (Lógica del Chat con Rangos) ---
io.on("connection", socket => {
    let currentUserID;

    // JOIN: Se ejecuta al entrar al chat
    socket.on("join", (perfil) => {
        currentUserID = perfil.id;
        
        // Asegura que el perfil tenga los campos de rango, incluso si no los trae del login
        if (!perfil.rango) {
             const users = readUsers();
             const userKey = perfil.usuario.toLowerCase();
             if (users[userKey]) {
                const rangoInfo = getRango(users[userKey].mensajes || 0);
                perfil.rango = rangoInfo.nombre;
                perfil.rangoCss = rangoInfo.cssClass;
             }
        }
        
        connectedUsers[perfil.id] = { ...perfil, socketId: socket.id }; 
        
        socket.broadcast.emit("server_message", { texto: `${perfil.nombre} se ha unido.`, tipo: 'status' });
        io.emit("update_users", Object.values(connectedUsers)); 
    });

    // MENSAJE GLOBAL
    socket.on("mensajeGlobal", (data) => {
        // 1. Aumentar el contador y actualizar el JSON
        const users = readUsers();
        const userKey = connectedUsers[data.id].usuario; 
        
        if (users[userKey]) {
            users[userKey].mensajes = (users[userKey].mensajes || 0) + 1;
            writeUsers(users);
            
            // 2. Recalcular el rango y actualizar el objeto conectado
            const rangoInfo = getRango(users[userKey].mensajes);
            connectedUsers[data.id].rango = rangoInfo.nombre;
            connectedUsers[data.id].rangoCss = rangoInfo.cssClass; 
            connectedUsers[data.id].nivel = rangoInfo.nivel;
        }

        const remitente = connectedUsers[data.id];
        if (!remitente) return;
        
        // 3. Emitir mensaje con la información del rango y la clase CSS
        io.emit("mensajeGlobal", { 
            ...data, 
            nombre: remitente.nombre, 
            rango: remitente.rango,
            rangoCss: remitente.rangoCss, // Envía la clase CSS para el frontend
            foto: remitente.foto 
        });

        // Opcional: Re-emitir la lista de usuarios si el rango cambió
        io.emit("update_users", Object.values(connectedUsers));
    });

    // MENSAJE PRIVADO
    socket.on("mensajePrivado", (data) => {
        const remitente = connectedUsers[data.id];
        if (!remitente) return;
        
        const targetUser = Object.values(connectedUsers).find(u => u.usuario === data.destino);
        
        if (targetUser) {
            // Enviar al destinatario
            io.to(targetUser.socketId).emit("mensajePrivado", { 
                ...data, 
                nombre: remitente.nombre, 
                foto: remitente.foto, 
                rango: remitente.rango,
                rangoCss: remitente.rangoCss,
                isSender: false 
            });
            // Enviar al remitente como confirmación
            io.to(remitente.socketId).emit("mensajePrivado", { 
                ...data, 
                nombre: remitente.nombre, 
                foto: remitente.foto, 
                rango: remitente.rango,
                rangoCss: remitente.rangoCss,
                isSender: true 
            });
        } else {
            io.to(remitente.socketId).emit("server_message", { 
                texto: `El usuario @${data.destino} no está conectado.`, 
                tipo: 'system' 
            });
        }
    });

    // ACTUALIZACIÓN DE PERFIL
    socket.on("profile_update", (updatedPerfil) => {
        if (connectedUsers[updatedPerfil.id]) {
            // Actualiza los datos conectados
            connectedUsers[updatedPerfil.id] = { 
                ...connectedUsers[updatedPerfil.id], 
                nombre: updatedPerfil.nombre, 
                foto: updatedPerfil.foto 
            };
            
            // Re-escribe el JSON de usuarios con los nuevos datos
            const users = readUsers();
            const userKey = connectedUsers[updatedPerfil.id].usuario;
            if (users[userKey]) {
                users[userKey].nombre = updatedPerfil.nombre;
                users[userKey].foto = updatedPerfil.foto;
                writeUsers(users);
            }
            
            io.emit("update_users", Object.values(connectedUsers)); 
            io.emit("server_message", { texto: `${updatedPerfil.nombre} actualizó su perfil.`, tipo: 'status' });
        }
    });


    // DESCONEXIÓN
    socket.on("disconnect", () => {
        const desconectado = Object.values(connectedUsers).find(u => u.socketId === socket.id);
        if (desconectado) {
            delete connectedUsers[desconectado.id];
            socket.broadcast.emit("server_message", { texto: `${desconectado.nombre} ha abandonado.`, tipo: 'status' });
            io.emit("update_users", Object.values(connectedUsers));
        }
    });
});

// --- INICIAR SERVIDOR ---
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));