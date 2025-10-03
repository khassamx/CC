// backend/server.js (Ubicación: Dentro de la carpeta backend/)

const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

// --- RUTA CRÍTICA CORREGIDA ---
const { getRango } = require("../src/utils"); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);
// El puerto 3000 es el estándar y el que usa Serveo. Si necesitas el 8080, cámbialo aquí.
const PORT = 3000; 

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
        if (!fs.existsSync(usersDataPath)) {
            console.warn("users.json no encontrado. Creando archivo vacío.");
            fs.writeFileSync(usersDataPath, JSON.stringify({}), 'utf8');
            return {};
        }
        return JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
    } catch (e) {
        console.error("Error leyendo users.json. Devolviendo objeto vacío.", e.message);
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

// ======================================================
//             RUTAS DE AUTENTICACIÓN Y CHAT
// ======================================================

// --- RUTA LOGIN CON CÁLCULO DE RANGO ---
app.post("/login", (req, res) => {
    const { usuario, password } = req.body;
    const users = readUsers();
    
    const userKey = usuario.toLowerCase(); 

    if(users[userKey] && users[userKey].password === password){
        let userProfile = users[userKey];

        if (typeof userProfile.mensajes !== 'number') {
            userProfile.mensajes = 0;
            writeUsers(users); 
        }
        
        const rangoInfo = getRango(userProfile.mensajes);
        userProfile.rango = rangoInfo.nombre; 
        userProfile.rangoCss = rangoInfo.cssClass; 
        userProfile.nivel = rangoInfo.nivel; 

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

// ======================================================
//             RUTAS DE DESCARGA V2.0
// ======================================================

// Ruta principal para servir la página de descargas
app.get("/descargas", (req, res) => {
    res.sendFile(path.join(rootDir, 'public', 'descargas.html'));
});

// 1. RUTA para descargar Video con opciones (Simulación de Progreso)
app.post("/descargar/video", (req, res) => {
    const { url, calidad, formato } = req.body;
    console.log(`[DESCARGA VIDEO] Solicitud recibida: URL=${url}, Calidad=${calidad}, Formato=${formato}`);
    
    if (!url) {
        return res.status(400).json({ ok: false, message: "URL no proporcionada." });
    }
    
    // Simulación del Proceso de Descarga (¡Aquí iría la lógica real!)
    
    // 1. Notificar al frontend que la tarea fue aceptada
    res.json({ 
        ok: true, 
        message: `Iniciando procesamiento de video (${calidad}, ${formato}).`,
        taskId: `video-${Date.now()}` // ID de tarea simulada para tracking
    });
    
    // 2. Simular el progreso usando Socket.IO (sería el paso real)
});

// 2. RUTA para descargar Audio (Simulación Simple)
app.post("/descargar/audio", (req, res) => {
    const { url } = req.body;
    console.log(`[DESCARGA AUDIO] Solicitud recibida para: ${url}`);
    
    if (!url) {
        return res.status(400).json({ ok: false, message: "URL no proporcionada." });
    }
    
    // Simulación de proceso exitoso
    setTimeout(() => {
        res.json({ 
            ok: true, 
            message: "Descarga de audio solicitada y aceptada por el servidor.",
        });
    }, 1500);
});

// 3. RUTA para extraer link directo (Simulación)
app.post("/extraer/link", (req, res) => {
    const { url } = req.body;
    console.log(`[LINK DIRECTO] Solicitud de link directo recibida para: ${url}`);
    
    if (!url) {
        return res.status(400).json({ ok: false, message: "URL no proporcionada." });
    }
    
    // Simulación de link directo
    const directLink = `https://generador-link.com/${btoa(url)}`;
    
    res.json({
        ok: true,
        message: "Link directo generado con éxito.",
        link: directLink
    });
});

// ======================================================
//               SOCKET.IO (Lógica del Chat)
// ======================================================

io.on("connection", socket => {
    let currentUserID;

    // JOIN: Se ejecuta al entrar al chat
    socket.on("join", (perfil) => {
        currentUserID = perfil.id;
        
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
        const remitente = connectedUsers[data.id];
        if (!remitente) return;
        
        const userKey = remitente.usuario; 
        
        if (users[userKey]) {
            users[userKey].mensajes = (users[userKey].mensajes || 0) + 1;
            writeUsers(users);
            
            // 2. Recalcular el rango
            const rangoInfo = getRango(users[userKey].mensajes);
            remitente.rango = rangoInfo.nombre;
            remitente.rangoCss = rangoInfo.cssClass; 
            remitente.nivel = rangoInfo.nivel;
        }
        
        // 3. Emitir mensaje con la información del rango y la clase CSS
        io.emit("mensajeGlobal", { 
            ...data, 
            nombre: remitente.nombre, 
            rango: remitente.rango,
            rangoCss: remitente.rangoCss, 
            foto: remitente.foto 
        });

        io.emit("update_users", Object.values(connectedUsers));
    });

    // MENSAJE PRIVADO
    socket.on("mensajePrivado", (data) => {
        const remitente = connectedUsers[data.id];
        if (!remitente) return;
        
        const targetUser = Object.values(connectedUsers).find(u => u.usuario === data.destino);
        
        if (targetUser) {
            io.to(targetUser.socketId).emit("mensajePrivado", { 
                ...data, 
                nombre: remitente.nombre, 
                foto: remitente.foto, 
                rango: remitente.rango,
                rangoCss: remitente.rangoCss,
                isSender: false 
            });
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
            connectedUsers[updatedPerfil.id] = { 
                ...connectedUsers[updatedPerfil.id], 
                nombre: updatedPerfil.nombre, 
                foto: updatedPerfil.foto 
            };
            
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