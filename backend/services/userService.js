// /backend/services/userService.js (Modo SIN SEGURIDAD - SOLO PRUEBAS)

const UserProfile = require('../models/user.model');
// NO necesitamos bcryptjs

// Configuración del líder
const FIRST_USER = { username: 'Oliver', rank: 'Líder' };

exports.authenticateUser = async (username) => {
    let user = await UserProfile.findOne({ username });

    if (!user) {
        // 1. REGISTRO
        let initialRank = 'Miembro';
        if (username === FIRST_USER.username) {
            initialRank = FIRST_USER.rank;
        }

        user = new UserProfile({ 
            username: username,
            chatname: username,
            passwordHash: 'no_pass', // Guardamos un valor dummy
            rank: initialRank 
        });
        await user.save();
        
        return { success: true, user: user };
        
    } else {
        // 2. LOGIN (Siempre exitoso si el usuario existe)
        user.lastActive = Date.now();
        await user.save();
        return { success: true, user: user };
    }
};
// ... (otras funciones)