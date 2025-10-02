// public/script.js (Lógica Adaptada a la Interfaz de Botones)

const user = JSON.parse(localStorage.getItem("userProfile") || '{}');
if (!user || !user.id) {
    // Redirigir al login si no hay perfil
    if (window.location.pathname !== '/login.html') {
        window.location.href = "login.html";
    }
}

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


// --- Lógica de Navegación por Botones ---
const secciones = document.querySelectorAll('.seccion');
let seccionActivaId = 'chat-global'; 
let targetUserPrivate = null;

function abrirSeccion(id) {
    secciones.forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex'; // Usamos 'flex' para las secciones
    seccionActivaId = id;
    
    // Si estamos en el chat privado, borramos el target al cambiar de pestaña
    if (id !== 'chat-privado') {
        targetUserPrivate = null;
        document.getElementById('target-user-info').textContent = '';
    }
    
    // Mostrar/Ocultar el footer del chat si es una sección de chat
    const chatFooter = document.getElementById('chat-footer');
    if (id === 'chat-global' || id === 'chat-privado') {
        chatFooter.style.display = 'flex';
    } else {
        chatFooter.style.display = 'none';
    }
}

document.querySelectorAll('#menu button[data-target]').forEach(button => {
    button.addEventListener('click', () => abrirSeccion(button.dataset.target));
});

// Inicializar mostrando el chat global
abrirSeccion('chat-global'); 


// --- Lógica del Chat y Socket.io ---

if (socket) {
    // Inicialización del usuario al servidor
    socket.emit("join", user);

    const mensajesGlobalDiv = document.getElementById("mensajes-global");
    const mensajeInput = document.getElementById("mensajeInput");
    const enviarBtn = document.getElementById("enviarBtn");
    const userList = document.getElementById("user-list");
    const targetUserInfo = document.getElementById("target-user-info");
    const archivoInput = document.getElementById("archivoInput");
    const enviarArchivoBtn = document.getElementById("enviarArchivoBtn");
    const uploadStatus = document.getElementById("upload-status");

    // 1. Renderizado de Mensajes
    function appendMessage(data, isPrivate = false) {
        // Decide dónde mostrar el mensaje
        const targetDiv = isPrivate ? document.getElementById("mensajes-privado") : mensajesGlobalDiv;
        if (!targetDiv) return;

        const isSender = isPrivate && data.isSender;
        const msgClass = isPrivate ? 'privado' : data.tipo || 'global';
        const senderName = isSender ? 'Tú (Privado)' : data.nombre;
        const mediaContent = data.path ? renderMedia(data.path, data.mime) : data.texto;
        const destinoTag = isPrivate && !isSender ? `[MP de ${data.nombre}] ` : (isPrivate ? `[MP para ${data.destino}] ` : '');
        
        targetDiv.innerHTML += `
            <div class="mensaje ${msgClass}">
                <img src="${data.foto || user.foto}" class="msg-photo" onerror="this.src='/uploads/default.png'">
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="rango">[${data.rango || user.rango}]</span>
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

        // PRIORIDAD 1: Chat Privado (si targetUserPrivate está fijado)
        if (targetUserPrivate) {
            socket.emit("mensajePrivado", { id: user.id, destino: targetUserPrivate, texto: texto });
            
        // PRIORIDAD 2: Chat Global (si no hay target fijado y la pestaña es Global)
        } else if (seccionActivaId === 'chat-global') {
            socket.emit("mensajeGlobal", { id: user.id, texto });

        // PRIORIDAD 3: Chat Privado (si está en la pestaña Privada y usa @usuario)
        } else if (seccionActivaId === 'chat-privado') {
             const match = texto.match(/^@(\w+)\s+(.*)/);
             if (match) {
                const destino = match[1];
                const mensaje = match[2];
                socket.emit("mensajePrivado", { id: user.id, destino: destino.toLowerCase(), texto: mensaje });
             } else {
                 alert("En la sección de Chat Privado, usa el formato: @usuario mensaje");
             }
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

    // Event Listeners
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
    socket.on("server_message", data => appendMessage({ texto: data.texto, rango: 'System' }, false));

    socket.on("update_users", (users) => {
        userList.innerHTML = '';
        users.forEach(u => {
            if (u.id === user.id) return; // No mostrarse a sí mismo
            const li = document.createElement('li');
            li.innerHTML = `<img src="${u.foto}" class="user-photo-list" onerror="this.src='/uploads/default.png'">
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


// --- Lógica del Perfil (Adaptada) ---
if (document.getElementById("perfil")) {
    const fotoImg = document.getElementById("foto");
    const nombreInput = document.getElementById("nombre");
    const subirMediaPerfilInput = document.getElementById("subirMediaPerfil");
    const guardarBtn = document.getElementById("guardarBtn");
    
    // Cargar datos
    fotoImg.src = user.foto;
    nombreInput.value = user.nombre;
    document.getElementById("id").textContent = user.id;
    document.getElementById("rango").textContent = user.rango;

    async function uploadAndSync(file) {
        // ... (Lógica de subida y actualización de perfil, idéntica a la anterior) ...
        const formData = new FormData();
        formData.append('media', file);
        
        try {
            const res = await fetch('/upload', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.ok) {
                user.foto = data.path; 
                localStorage.setItem("userProfile", JSON.stringify(user));
                fotoImg.src = data.path;
                socket.emit("profile_update", user);
                alert("Foto/Video de perfil actualizado ✅");
            }
        } catch (error) {
            alert("Error al subir el archivo.");
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
        socket.emit("profile_update", user);
        alert("Perfil guardado ✅");
    });
}