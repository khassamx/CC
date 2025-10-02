// middleware.js

/**
 * Middleware para asegurar que el usuario ha iniciado sesión.
 * Asume que el servidor usa express-session.
 */
function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        // El usuario está autenticado, continuar con la solicitud
        return next();
    }
    // No está autenticado, redirigir al login
    res.redirect('/login');
}

module.exports = { ensureAuthenticated };