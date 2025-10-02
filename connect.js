// connect.js (VERSIÓN CORREGIDA PARA PUERTO 8080 y SUBDOMINIO NUEVO)

const localtunnel = require('localtunnel');

async function startTunnel() {
    try {
        const PORT_TO_EXPOSE = 8080; 
        console.log(`\nIniciando túnel para el puerto ${PORT_TO_EXPOSE}...`);
        
        // CRÍTICO: ¡CAMBIA ESTE subdominio por uno que te guste y sea único!
        // Usar un nombre nuevo como 'chat-de-rangos-2025' suele evitar la página de advertencia de contraseña.
        const tunnel = await localtunnel({ 
            port: PORT_TO_EXPOSE, 
            subdomain: 'chat-de-rangos-2025' // <-- ¡NUEVO SUBDOMINIO!
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