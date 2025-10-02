const UserProfile = require('../models/user.model');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Nivel de hasheo

exports.authenticateUser = async (username, password) => {
    let user = await UserProfile.findOne({ username });

    if (!user) {
        // REGISTRO: Hashear y guardar el nuevo usuario
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        user = new UserProfile({ 
            username: username,
            chatname: username, // Chatname por defecto es el username
            passwordHash: passwordHash
        });
        await user.save();
        return { success: true, user: user };
    } else {
        // LOGIN: Comparar hash
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        return isMatch 
            ? { success: true, user: user }
            : { success: false, message: 'Contraseña incorrecta.' };
    }
};
// ... (otras funciones)