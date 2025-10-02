// connect.js

const localtunnel = require('localtunnel');

async function startTunnel() {
    try {
        console.log('Iniciando túnel para el puerto 3000...');
        
        // Puedes cambiar 'mi-chat-unico' por un nombre que quieras, o dejarlo en null para que sea aleatorio.
        const tunnel = await localtunnel({ 
            port: 3000, 
            subdomain: 'tu-chat-global-aqui' // ¡IMPORTANTE! Cambia esto
        });

        console.log(`\n🎉 ¡Túnel establecido! 🎉`);
        console.log(`Tu chat está disponible en la URL pública: ${tunnel.url}`);
        console.log(`\n**Deja esta terminal abierta para mantener la conexión.**`);

        // Este evento se dispara si el subdominio está en uso y se asigna uno nuevo.
        tunnel.on('url', (url) => {
            console.log(`\nURL actualizada (si el subdominio no estaba disponible): ${url}`);
        });

        // Este código evita que la aplicación se cierre inmediatamente.
    } catch (error) {
        console.error('Error al iniciar localtunnel:', error);
    }
}

startTunnel();