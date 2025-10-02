// public/script.js (Lógica completa del frontend)

const user = JSON.parse(localStorage.getItem("userProfile") || '{}');
if (!user || !user.id) {
    // Si no hay perfil, redirigir al login (seguridad)
    if (window.location.pathname !== '/login.html') {
        window.location.href = "login.html";
    }
}

const socket = window.location.pathname.includes('chat.html') || window.location.pathname.includes('perfil.html') ? io() : null;

// --- Funciones Compartidas ---
function renderMedia(path, mime) {
    if (mime && mime.startsWith('image/')) {
        return `<a href="${path}" target="_blank"><img src="${path}" alt="Imagen subida" style="max-width: 100%; max-height: 200px; border-radius: 5px;"></a>`;
    } else if (mime && mime.startsWith('video/')) {
        return `<video controls src="${path}" style="max-width: 100%; max-height: 200px; border-radius: 5px;"></video>`;
    } else {
        return `<a href="${path}" target="_blank">[Archivo subido] ${path.split('/').pop()}</a>`;
    }
}

// --- Lógica del Perfil (perfil.html) ---
if (document.getElementById("perfil-container") && socket) {
    const fotoImg = document.getElementById("foto");
    const nombreInput = document.getElementById("nombre");
    const subirMediaInput = document.getElementById("subirMedia");
    const guardarBtn = document.getElementById("guardarBtn");
    
    // Cargar datos
    fotoImg.src = user.foto;
    nombreInput.value = user.nombre;
    document.getElementById("id").textContent = user.id;
    document.getElementById("rango").textContent = user.rango;

    async function uploadAndSync(file) {
        const formData = new FormData();
        formData.append('media', file); // 'media' coincide con server.js
        
        try {
            const res = await fetch('/upload', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.ok) {
                // 1. Actualizar el objeto local
                user.foto = data.path; 
                localStorage.setItem("userProfile", JSON.stringify(user));
                fotoImg.src = data.path;
                
                // 2. Notificar al servidor
                socket.emit("profile_update", user);
                alert("Foto/Video de perfil actualizado ✅");
            }
        } catch (error) {
            alert("Error al subir el archivo.");
            console.error(error);
        }
    }

    subirMediaInput.addEventListener("change", (e) => {
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

// --- Lógica del Chat (chat.html) ---
if (document.getElementById("mensajes") && socket) {
    const mensajesDiv = document.getElementById("mensajes");
    const mensajeInput = document.getElementById("mensajeInput");
    const enviarBtn = document.getElementById("enviarBtn");
    const archivoInput = document.getElementById("archivoInput");
    const userList = document.getElementById("user-list");
    const targetUserInfo = document.getElementById("target-user-info");

    // Enviar evento JOIN al servidor
    socket.emit("join", user);

    // ------------------------------------
    // 1. Renderizado de Mensajes
    // ------------------------------------
    function appendMessage(data, isPrivate = false) {
        const isSender = isPrivate && data.isSender;
        const msgClass = isPrivate ? 'privado' : data.tipo || 'global';
        const senderName = isSender ? 'Tú (Privado)' : data.nombre;
        const mediaContent = data.path ? renderMedia(data.path, data.mime) : data.texto;
        const destinoTag = isPrivate && !isSender ? `[MP de ${data.nombre}] ` : (isPrivate ? `[MP para ${data.destino}] ` : '');
        
        mensajesDiv.innerHTML += `
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
        mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
    }

    // ------------------------------------
    // 2. Subida y Envío de Archivos
    // ------------------------------------
    archivoInput.addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("media", file); // 'media' coincide con server.js

        try {
            const res = await fetch("/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (data.ok) {
                // Envía el path del archivo y el tipo MIME a todos
                socket.emit("mensajeGlobal", { 
                    id: user.id, 
                    texto: `[Contenido Multimedia]`,
                    path: data.path, 
                    mime: data.mime 
                });
            }
        } catch (error) {
            alert("Error al subir el archivo.");
            console.error(error);
        }
        archivoInput.value = ''; // Limpiar input de archivo
    });

    // ------------------------------------
    // 3. Lógica de Envío de Texto
    // ------------------------------------
    function enviarMensaje() {
        const texto = mensajeInput.value.trim();
        if (!texto) return;

        // Chat privado: @usuario mensaje
        const match = texto.match(/^@(\w+)\s+(.*)/);
        if (match) {
            const destino = match[1];
            const mensaje = match[2];
            socket.emit("mensajePrivado", { id: user.id, destino: destino.toLowerCase(), texto: mensaje });
        } else {
            // Chat Global
            socket.emit("mensajeGlobal", { id: user.id, texto });
        }
        mensajeInput.value = '';
    }

    enviarBtn.addEventListener("click", enviarMensaje);
    mensajeInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            enviarMensaje();
        }
    });

    // ------------------------------------
    // 4. Recepción de Eventos y Lista de Usuarios
    // ------------------------------------
    socket.on("mensajeGlobal", data => appendMessage(data, false));
    socket.on("mensajePrivado", data => appendMessage(data, true));
    socket.on("server_message", data => appendMessage({ texto: data.texto, rango: 'System' }, false));

    socket.on("update_users", (users) => {
        userList.innerHTML = '';
        users.forEach(u => {
            const li = document.createElement('li');
            li.innerHTML = `<img src="${u.foto}" class="user-photo-list" onerror="this.src='/uploads/default.png'">
                            <span>${u.nombre} [${u.rango}]</span>`;
            li.onclick = () => {
                targetUserInfo.textContent = ` (MP a @${u.usuario})`;
                mensajeInput.value = `@${u.usuario} `;
                mensajeInput.focus();
            };
            userList.appendChild(li);
        });
    });
}