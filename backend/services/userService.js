const UserProfile = require('../models/user.model');
const bcrypt = require('bcryptjs'); // Usando bcryptjs
const SALT_ROUNDS = 10; 

// --- CONFIGURACIÓN DE LÍDER ---
const FIRST_USER = { username: 'Oliver', initialPass: '1283', rank: 'Líder' };
// -----------------------------

exports.authenticateUser = async (username, password) => {
    let user = await UserProfile.findOne({ username });

    if (!user) {
        // 1. REGISTRO
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // ⬅️ LÓGICA DE PRIMER USUARIO (LÍDER)
        let initialRank = 'Miembro';
        if (username === FIRST_USER.username && password === FIRST_USER.initialPass) {
            // Si el primer usuario usa la credencial secreta
            initialRank = FIRST_USER.rank;
        }

        user = new UserProfile({ 
            username: username,
            chatname: username,
            passwordHash: passwordHash,
            rank: initialRank // Asigna el rango aquí
        });
        await user.save();
        
        return { success: true, user: user };
        
    } else {
        // 2. LOGIN
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        
        if (isMatch) {
            user.lastActive = Date.now();
            await user.save();
            return { success: true, user: user };
        } else {
            return { success: false, message: 'Contraseña incorrecta.' };
        }
    }
};

// ... (otras funciones)