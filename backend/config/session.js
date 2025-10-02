const session = require('express-session');

/**
 * Configura y retorna el middleware de Express Session.
 */
function configureSession() {
    return session({
        secret: 'CLAVE_SECRETA_FUERTE_DE_TU_PROYECTO_3321', // ¡CRÍTICO: CAMBIAR!
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // 'true' si usas HTTPS (producción)
    });
}

module.exports = { configureSession };