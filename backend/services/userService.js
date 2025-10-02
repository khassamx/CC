// /backend/services/userService.js (Modo SIN SEGURIDAD/PRUEBA RÁPIDA)

const UserProfile = require('../models/user.model');
// NO USAMOS bcryptjs aquí

const FIRST_USER = { username: 'Oliver', rank: 'Líder' };

exports.authenticateUser = async (username) => {
    let user = await UserProfile.findOne({ username });

    if (!user) {
        // REGISTRO AUTOMÁTICO
        let initialRank = (username === FIRST_USER.username) ? FIRST_USER.rank : 'Miembro';
        
        user = new UserProfile({ 
            username: username,
            chatname: username,
            passwordHash: 'no_pass', 
            rank: initialRank 
        });
        await user.save();
        
    } else {
        // LOGIN AUTOMÁTICO
        user.lastActive = Date.now();
        await user.save();
    }
    
    // CRÍTICO: Siempre retorna éxito después de crear/encontrar al usuario
    return { success: true, user: user };
};