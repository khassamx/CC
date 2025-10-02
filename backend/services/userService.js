const UserProfile = require('../models/user.model');
const bcrypt = require('bcrypt'); // <--- ¡AQUÍ VA BCYPT!
const SALT_ROUNDS = 10; 

exports.authenticateUser = async (username, password) => {
    let user = await UserProfile.findOne({ username });

    if (!user) {
        // Lógica de REGISTRO
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        user = new UserProfile({ 
            username: username,
            chatname: username,
            passwordHash: passwordHash
        });
        await user.save();
        return { success: true, user: user };
    } else {
        // Lógica de LOGIN
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

exports.updateUserRank = async (username, newRank) => {
    return UserProfile.updateOne({ username }, { rank: newRank });
};