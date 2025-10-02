// server.js (Ubicación: Carpeta backend/)

const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// --- CONFIGURACIÓN BASE ---
const rootDir = path.join(__dirname, '..'); // Directorio raíz del proyecto
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos: public/ y uploads/
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// --- ALMACÉN DE USUARIOS CONECTADOS ---
const connectedUsers = {};

// --- CONFIGURACIÓN SUBIDA DE ARCHIVOS (Multer) ---
const storage = multer.diskStorage({
    destination: path.join(rootDir, 'uploads'), // Ruta corregida
    filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname.toLowerCase().replace(/\s/g, '-'))
});
const upload = multer({ storage });

// --- RUTA LOGIN CON CONTRASEÑA ---
app.post("/login", (req, res) => {
    const { usuario, password } = req.body;
    const usersPath = path.join(__dirname, 'users.json'); // Ruta corregida
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const userKey = usuario.toLowerCase();

    if(users[userKey] && users[userKey].password === password){
        const userProfile = { ...users[userKey] }; 
        res.json({ ok: true, user: userProfile });
    } else {
        res.status(401).json({ ok: false, message: "Usuario o contraseña incorrecta." });
    }
});

// --- RUTA SUBIR FOTO/VIDEO ---
// El campo debe ser 'media', no 'archivo', para soportar la lógica del frontend.
app.post("/upload", upload.single("media"), (req,res) => {
    if (req.file) {
        const filePath = "/uploads/" + req.file.filename;
        res.json({ ok: true, path: filePath, mime: req.file.mimetype });
    } else {
        res.status(400).json({ ok: false, message: "Fallo al subir el archivo." });
    }
});

// --- SOCKET.IO (Lógica del Chat) ---
io.on("connection", socket => {
    let currentUserID;

    // JOIN: Se ejecuta al entrar al chat.html
    socket.on("join", (perfil) => {
        currentUserID = perfil.id;
        connectedUsers[perfil.id] = { ...perfil, socketId: socket.id }; 
        
        socket.broadcast.emit("server_message", { texto: `${perfil.nombre} se ha unido.`, tipo: 'status' });
        io.emit("update_users", Object.values(connectedUsers)); // Actualiza lista de usuarios
    });

    // MENSAJE GLOBAL
    socket.on("mensajeGlobal", (data) => {
        const remitente = connectedUsers[data.id];
        if (!remitente) return;
        io.emit("mensajeGlobal", { 
            ...data, 
            nombre: remitente.nombre, 
            rango: remitente.rango, 
            foto: remitente.foto 
        });
    });

    // MENSAJE PRIVADO
    socket.on("mensajePrivado", (data) => {
        const remitente = connectedUsers[data.id];
        if (!remitente) return;
        
        const targetUser = Object.values(connectedUsers).find(u => u.usuario === data.destino);
        
        if (targetUser) {
            // Enviar al destinatario
            io.to(targetUser.socketId).emit("mensajePrivado", { ...data, nombre: remitente.nombre, foto: remitente.foto, isSender: false });
            // Enviar al remitente como confirmación
            io.to(remitente.socketId).emit("mensajePrivado", { ...data, nombre: remitente.nombre, foto: remitente.foto, isSender: true });
        } else {
            io.to(remitente.socketId).emit("server_message", { 
                texto: `El usuario @${data.destino} no está conectado.`, 
                tipo: 'system' 
            });
        }
    });

    // ACTUALIZACIÓN DE PERFIL (Para subir la foto)
    socket.on("profile_update", (updatedPerfil) => {
        if (connectedUsers[updatedPerfil.id]) {
            connectedUsers[updatedPerfil.id] = { ...connectedUsers[updatedPerfil.id], ...updatedPerfil };
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