// server.js (Ubicación: Carpeta Raíz)

const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Middleware para parsear JSON (peticiones POST)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURACIÓN DE RUTAS Y MULTER (Archivos) ---
// La carpeta raíz del proyecto es '..' porque server.js está en 'backend/'
const rootDir = path.join(__dirname, '..');

// Servir archivos estáticos: public/ y uploads/
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// Configuración subida de archivos
const storage = multer.diskStorage({
    destination: path.join(rootDir, 'uploads'), // Guardar en la carpeta uploads/
    filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname.toLowerCase().replace(/\s/g, '-'))
});
const upload = multer({ storage });

// --- ALMACÉN DE USUARIOS CONECTADOS ---
const connectedUsers = {};

// --- LOGIN CON CONTRASEÑA (Ruta HTTP POST) ---
app.post("/login", (req, res) => {
    const { usuario, password } = req.body;
    // CRÍTICO: Leer el users.json de la carpeta backend/
    const usersPath = path.join(__dirname, 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    const userKey = usuario.toLowerCase();

    if(users[userKey] && users[userKey].password === password){
        // Usamos el perfil del JSON y agregamos la URL de la foto del JSON
        const userProfile = { ...users[userKey] }; 
        res.json({ ok: true, user: userProfile });
    } else {
        res.status(401).json({ ok: false, message: "Usuario o contraseña incorrecta." });
    }
});

// --- SUBIR FOTO/VIDEO (Ruta HTTP POST) ---
app.post("/upload", upload.single("media"), (req, res) => {
    if(req.file){
        // Devolver la URL pública: /uploads/nombre-del-archivo
        const filePath = "/uploads/" + req.file.filename;
        res.json({ ok: true, path: filePath, mime: req.file.mimetype });
    } else {
        res.status(400).json({ ok: false, message: "Fallo al subir el archivo." });
    }
});

// --- SOCKET.IO (Tiempo Real) ---
io.on("connection", socket => {
    let currentUserID;

    // 1. JOIN (El cliente se conecta y envía su perfil de localStorage)
    socket.on("join", (perfil) => {
        currentUserID = perfil.id;
        connectedUsers[perfil.id] = { ...perfil, socketId: socket.id };
        console.log(`[JOIN] ${perfil.nombre} (${socket.id})`);
        
        socket.broadcast.emit("server_message", { texto: `${perfil.nombre} se ha unido.`, tipo: 'status' });
        io.emit("update_users", Object.values(connectedUsers));
    });

    // 2. ACTUALIZACIÓN DE PERFIL
    socket.on("profile_update", (updatedPerfil) => {
        if (connectedUsers[updatedPerfil.id]) {
            connectedUsers[updatedPerfil.id] = { ...connectedUsers[updatedPerfil.id], ...updatedPerfil };
            io.emit("update_users", Object.values(connectedUsers));
            io.emit("server_message", { texto: `${updatedPerfil.nombre} actualizó su perfil.`, tipo: 'status' });
        }
    });

    // 3. MENSAJES (Global y Privado)
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

    socket.on("mensajePrivado", (data) => {
        const remitente = connectedUsers[data.id];
        if (!remitente) return;
        
        const targetSocket = Object.values(connectedUsers).find(u => u.usuario === data.destino)?.socketId;
        
        if (targetSocket) {
            // Enviar al destinatario
            io.to(targetSocket).emit("mensajePrivado", { ...data, nombre: remitente.nombre, foto: remitente.foto });
            // Enviar al remitente como confirmación
            io.to(remitente.socketId).emit("mensajePrivado", { ...data, nombre: remitente.nombre, foto: remitente.foto, isSender: true });
        } else {
            // Manejar error si el usuario no está conectado
            io.to(remitente.socketId).emit("server_message", { 
                texto: `El usuario ${data.destino} no está conectado.`, 
                tipo: 'system' 
            });
        }
    });

    // 4. DESCONEXIÓN
    socket.on("disconnect", () => {
        const desconectado = Object.values(connectedUsers).find(u => u.socketId === socket.id);
        if (desconectado) {
            delete connectedUsers[desconectado.id];
            socket.broadcast.emit("server_message", { texto: `${desconectado.nombre} ha abandonado.`, tipo: 'status' });
            io.emit("update_users", Object.values(connectedUsers));
        }
    });
});

server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));