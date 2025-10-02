const express = require('express');
const path = require('path');
const { ensureAuthenticated } = require('./middleware');

const router = express.Router();
const publicPath = path.join(__dirname, '../../public');

// A. Ruta de Login (/login)
router.get('/login', (req, res) => {
    res.sendFile(path.join(publicPath, 'login.html'));
});

// B. Ruta Raíz (/)
// Redirige al chat si está logueado, sino al login.
router.get('/', (req, res) => {
    if (req.session && req.session.isAuthenticated) {
        res.redirect('/chat');
    } else {
        res.redirect('/login');
    }
});

// C. Ruta del Chat (/chat) - PROTEGIDA
router.get('/chat', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(publicPath, 'chat.html'));
});

// D. Rutas Secundarias (PROTEGIDAS)
router.get('/rank', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(publicPath, 'user_rank.html'));
});

router.get('/profile', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(publicPath, 'user_profile.html'));
});

// E. Ruta de Errores
router.get('/error', (req, res) => {
    res.sendFile(path.join(publicPath, 'error.html'));
});


module.exports = router;