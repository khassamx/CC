// connect.js (VERSIÓN CORREGIDA PARA PUERTO 8080)

const localtunnel = require('localtunnel');

async function startTunnel() {
    try {
        // --- CRÍTICO: El puerto ha sido cambiado a 8080 ---
        const PORT_TO_EXPOSE = 8080; 
        console.log(`\nIniciando túnel para el puerto ${PORT_TO_EXPOSE}...`);
        
        // ¡IMPORTANTE! Cambia 'tu-chat-global-aqui' por un nombre de subdominio que quieras usar. 
        // Si ya usaste uno, el sistema puede forzarte a usar otro, o puedes dejarlo null.
        const tunnel = await localtunnel({ 
            port: PORT_TO_EXPOSE, 
            subdomain: 'tu-chat-global-aqui' // ¡Cámbialo si quieres uno fijo!
        });

        console.log(`\n🎉 ¡Túnel establecido! 🎉`);
        console.log(`Tu chat está disponible en la URL pública: ${tunnel.url}`);
        console.log(`\n**Deja esta terminal abierta para mantener la conexión.**`);
        console.log(`--------------------------------------------------------`);
        
        // Muestra la URL si cambia (por ejemplo, si el subdominio estaba en uso)
        tunnel.on('url', (url) => {
            console.log(`\nURL actualizada: ${url}`);
        });

        // Este listener ayuda a mantener el proceso vivo.
        tunnel.on('error', (err) => {
             console.error(`\n[ERROR DE TÚNEL] El túnel se ha cerrado inesperadamente.`, err.message);
        });

    } catch (error) {
        console.error('\n[ERROR FATAL] No se pudo iniciar localtunnel. Asegúrate de que el servidor (npm start) está corriendo y el subdominio no está en uso.', error.message);
    }
}

startTunnel();