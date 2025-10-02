const UserProfile = require('../models/user.model');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Nivel de seguridad para el hasheo

/**
 * Autentica un usuario o lo registra si no existe.
 * @param {string} username - Nombre de usuario.
 * @param {string} password - Contraseña en texto plano.
 * @returns {object} { success: boolean, user: UserProfile | null, message?: string }
 */
exports.authenticateUser = async (username, password) => {
    let user = await UserProfile.findOne({ username });

    if (!user) {
        // 1. USUARIO NO EXISTE (REGISTRO AUTOMÁTICO)
        try {
            // Generar el hash de la contraseña de forma segura
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            
            user = new UserProfile({ 
                username: username,
                chatname: username, // Chatname por defecto es el username
                passwordHash: passwordHash
            });
            await user.save();
            
            console.log(`[AUTH] Nuevo usuario registrado: ${username}`);
            return { success: true, user: user };
        } catch (error) {
            console.error(`[DB ERROR] Fallo al registrar usuario ${username}:`, error);
            return { success: false, message: 'Fallo interno al registrar.' };
        }
        
    } else {
        // 2. USUARIO EXISTE (LOGIN NORMAL)
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        
        if (isMatch) {
            // Contraseña correcta: Actualizar la última actividad
            user.lastActive = Date.now();
            await user.save();
            return { success: true, user: user };
        } else {
            // Contraseña incorrecta
            return { success: false, message: 'Contraseña incorrecta.' };
        }
    }
};

/**
 * Función genérica para actualizar el rango (usada por el módulo de moderación).
 */
exports.updateUserRank = async (username, newRank) => {
    return UserProfile.updateOne({ username }, { rank: newRank });
};