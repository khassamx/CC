// public/script.js (VERSIÓN CORREGIDA Y OPTIMIZADA)

const user = JSON.parse(localStorage.getItem("userProfile") || '{}');
// CRÍTICO: Redireccionamiento a la nueva página principal 'index.html'
if (!user || !user.id) {
    if (window.location.pathname !== '/login.html') {
        window.location.href = "login.html";
    }
}

// Inicialización de Socket.io (Se hace aquí para que esté disponible globalmente)
const socket = io();

// --- Lógica del Tema Automático ---
if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
    document.body.classList.add('dark');
} else {
    document.body.classList.add('light');
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
}


// --- Lógica de Navegación por Botones (abrirSeccion) ---
const secciones = document.querySelectorAll('.seccion');
// Variables globales para el estado del chat
let seccionActivaId = 'chat-global'; 
let targetUserPrivate = null;

const mensajeInput = document.getElementById("mensajeInput");
const enviarBtn = document.getElementById("enviarBtn");
const targetUserInfo = document.getElementById("target-user-info");
const chatFooter = document.getElementById('chat-footer');


function abrirSeccion(id) {
    secciones.forEach(s => s.style.display = 'none');
    
    // Las secciones chat-global, chat-privado y subir-archivos deben usar 'flex' para diseño responsivo.
    const displayStyle = (id === 'chat-global' || id === 'chat-privado' || id === 'subir-archivos') ? 'flex' : 'block';
    
    const targetElement = document.getElementById(id);
    if (targetElement) {
        targetElement.style.display = displayStyle;
    }
    
    seccionActivaId = id;
    
    // Lógica para mostrar/ocultar el input de mensaje
    if (id === 'chat-global' || id === 'chat-privado') {
        chatFooter.style.display = 'flex';
        mensajeInput.placeholder = targetUserPrivate 
            ? `Escribiendo mensaje privado para @${targetUserPrivate}...`
            : "Escribe un mensaje o @usuario mensaje...";
    } else {
        chatFooter.style.display = 'none';
    }

    // Si salimos del chat privado, borramos el target.
    if (id !== 'chat-privado' && id !== 'chat-global') {
        targetUserPrivate = null;
        targetUserInfo.textContent = '';
    }
}

// Inicializar la escucha de los botones y mostrar la sección inicial
document.querySelectorAll('#menu button[data-target]').forEach(button => {
    button.addEventListener('click', () => abrirSeccion(button.dataset.target));
});

// Forzar la carga de datos del perfil al inicio para que estén disponibles
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosPerfil();
    // Abrir la sección por defecto después de cargar el DOM
    abrirSeccion('chat-global'); 
});


// --- Lógica del Chat y Socket.io (Todo el código de chat debe estar aquí) ---
if (socket) {
    // Inicialización del usuario al servidor
    socket.emit("join", user);

    const mensajesGlobalDiv = document.getElementById("mensajes-global");
    const userList = document.getElementById("user-list");
    const archivoInput = document.getElementById("archivoInput");
    const enviarArchivoBtn = document.getElementById("enviarArchivoBtn");
    const uploadStatus = document.getElementById("upload-status");


    // 1. Renderizado de Mensajes
    function appendMessage(data, isPrivate = false) {
        // Decide dónde mostrar el mensaje
        const targetDiv = isPrivate ? document.getElementById("mensajes-privado") : mensajesGlobalDiv;
        if (!targetDiv) return;

        // Si es un mensaje privado, filtramos para que sólo se muestre si la pestaña es la correcta
        if (isPrivate && seccionActivaId !== 'chat-privado') {
            // Podrías agregar una notificación visual si el mensaje llega en otra pestaña
            // console.log("Mensaje privado recibido en otra pestaña, no se renderiza automáticamente.");
            // return;
        }

        const isSender = isPrivate && data.isSender;
        const msgClass = isPrivate ? 'privado' : data.tipo || 'global';
        const senderName = isSender ? 'Tú (Privado)' : data.nombre;
        const mediaContent = data.path ? renderMedia(data.path, data.mime) : data.texto;
        const destinoTag = isPrivate && !isSender ? `[MP de ${data.nombre}] ` : (isPrivate ? `[MP para ${data.destino}] ` : '');
        
        targetDiv.innerHTML += `
            <div class="mensaje ${msgClass}">
                <img src="${data.foto || '/uploads/default.png'}" class="msg-photo" onerror="this.src='/uploads/default.png'">
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="rango">[${data.rango || 'User'}]</span>
                        <span class="usuario">${senderName}</span>
                    </div>
                    <p>${destinoTag}${mediaContent}</p>
                </div>
            </div>
        `;
        targetDiv.scrollTop = targetDiv.scrollHeight;
    }
    
    function renderMedia(path, mime) {
        if (mime && mime.startsWith('image/')) {
            return `<a href="${path}" target="_blank"><img src="${path}" alt="Imagen subida" style="max-width: 100%; max-height: 200px; border-radius: 5px;"></a>`;
        } else if (mime && mime.startsWith('video/')) {
            return `<video controls src="${path}" style="max-width: 100%; max-height: 200px; border-radius: 5px;"></video>`;
        } else {
            return `<a href="${path}" target="_blank">[Archivo subido] ${path.split('/').pop()}</a>`;
        }
    }


    // 2. Lógica de Envío de Texto y MP
    function enviarMensaje() {
        const texto = mensajeInput.value.trim();
        if (!texto) return;

        // Comprobamos en qué modo de chat estamos
        if (targetUserPrivate) {
            // MODO 1: MP fijo (desde el clic en la lista de usuarios)
            socket.emit("mensajePrivado", { id: user.id, destino: targetUserPrivate, texto: texto });
            
        } else if (seccionActivaId === 'chat-privado') {
            // MODO 2: MP en la pestaña privada, usando @usuario
             const match = texto.match(/^@(\w+)\s+(.*)/);
             if (match) {
                const destino = match[1].toLowerCase();
                const mensaje = match[2];
                socket.emit("mensajePrivado", { id: user.id, destino: destino, texto: mensaje });
             } else {
                 alert("En el chat privado, usa el formato: @usuario mensaje o haz clic en un usuario.");
             }
        } else {
            // MODO 3: Chat Global
            socket.emit("mensajeGlobal", { id: user.id, texto });
        }
        
        mensajeInput.value = '';
    }
    
    // 3. Subida de Archivos desde la sección dedicada
    enviarArchivoBtn.addEventListener("click", async () => {
        const file = archivoInput.files[0];
        if (!file) {
            uploadStatus.textContent = "Selecciona un archivo primero.";
            return;
        }

        const formData = new FormData();
        formData.append("media", file);

        uploadStatus.textContent = "Subiendo archivo...";
        try {
            const res = await fetch("/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (data.ok) {
                socket.emit("mensajeGlobal", { 
                    id: user.id, 
                    texto: `[Contenido Multimedia]`,
                    path: data.path, 
                    mime: data.mime 
                });
                uploadStatus.textContent = "Archivo subido y enviado al chat global ✅";
                archivoInput.value = '';
                abrirSeccion('chat-global'); // Volver al chat global
            }
        } catch (error) {
            uploadStatus.textContent = "Error al subir el archivo.";
            console.error(error);
        }
    });

    // CRÍTICO: Los Event Listeners para enviar mensajes
    enviarBtn.addEventListener("click", enviarMensaje);
    mensajeInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            enviarMensaje();
        }
    });


    // 4. Recepción de Eventos y Lista de Usuarios
    socket.on("mensajeGlobal", data => appendMessage(data, false));
    socket.on("mensajePrivado", data => appendMessage(data, true));
    socket.on("server_message", data => appendMessage({ texto: data.texto, rango: 'System', nombre: 'System' }, false));

    socket.on("update_users", (users) => {
        userList.innerHTML = '';
        users.forEach(u => {
            if (u.id === user.id) return; // No mostrarse a sí mismo
            const li = document.createElement('li');
            li.innerHTML = `<img src="${u.foto || '/uploads/default.png'}" class="user-photo-list" onerror="this.src='/uploads/default.png'">
                            <span>${u.nombre} [${u.rango}]</span>`;
            li.onclick = () => {
                targetUserPrivate = u.usuario.toLowerCase();
                targetUserInfo.textContent = ` (MP fijo a @${targetUserPrivate})`;
                mensajeInput.placeholder = `Escribiendo mensaje privado para @${targetUserPrivate}...`;
                abrirSeccion('chat-privado'); // Cambiar a la pestaña privada
                mensajeInput.focus();
            };
            userList.appendChild(li);
        });
    });
}


// --- Lógica del Perfil (Corrección para asegurar la carga al inicio) ---
function cargarDatosPerfil() {
    if (!document.getElementById("perfil")) return;

    const fotoImg = document.getElementById("foto");
    const nombreInput = document.getElementById("nombre");
    const subirMediaPerfilInput = document.getElementById("subirMediaPerfil");
    const guardarBtn = document.getElementById("guardarBtn");
    
    // Cargar datos
    fotoImg.src = user.foto || '/uploads/default.png';
    nombreInput.value = user.nombre || "";
    document.getElementById("id").textContent = user.id || "N/A";
    document.getElementById("rango").textContent = user.rango || "User";

    async function uploadAndSync(file) {
        const formData = new FormData();
        formData.append('media', file);
        
        try {
            const res = await fetch('/upload', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.ok) {
                user.foto = data.path; 
                localStorage.setItem("userProfile", JSON.stringify(user));
                fotoImg.src = data.path;
                if (socket) socket.emit("profile_update", user);
                alert("Foto/Video de perfil actualizado ✅");
            } else {
                 alert(`Error al subir: ${data.error || 'Desconocido'}`);
            }
        } catch (error) {
            alert("Error de conexión al subir el archivo.");
            console.error(error);
        }
    }

    subirMediaPerfilInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) uploadAndSync(file);
    });

    guardarBtn.addEventListener("click", () => {
        user.nombre = nombreInput.value;
        localStorage.setItem("userProfile", JSON.stringify(user));
        if (socket) socket.emit("profile_update", user);
        alert("Perfil guardado ✅");
    });
}