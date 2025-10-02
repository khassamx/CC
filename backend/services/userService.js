// /backend/services/userService.js (Modo SIN SEGURIDAD - SOLO PRUEBAS)

const UserProfile = require('../models/user.model');
// No usamos bcryptjs para la prueba rápida

// Configuración del líder
const FIRST_USER = { username: 'Oliver', rank: 'Líder' };

exports.authenticateUser = async (username) => {
    let user = await UserProfile.findOne({ username });

    if (!user) {
        // 1. REGISTRO
        let initialRank = (username === FIRST_USER.username) ? FIRST_USER.rank : 'Miembro';
        
        user = new UserProfile({ 
            username: username,
            chatname: username,
            passwordHash: 'no_pass', // Valor dummy
            rank: initialRank 
        });
        await user.save();
        
    } else {
        // 2. LOGIN (Siempre exitoso si el usuario ya existe)
        user.lastActive = Date.now();
        await user.save();
    }
    
    // CRÍTICO: Siempre retorna éxito después de crear/encontrar el usuario
    return { success: true, user: user };
};
// ... (otras funciones permanecen igual)