// /backend/services/userService.js (Actualización para Alias)
// ...

exports.authenticateUser = async (username) => {
    let user = await UserProfile.findOne({ username }); // Busca por la clave

    if (!user) {
        // REGISTRO: Asignación de CHATNAME (alias)
        let initialRank = (username === FIRST_USER.username) ? FIRST_USER.rank : 'Miembro';
        
        // CRÍTICO: El nombre del chat por defecto es el nombre de usuario + un sufijo para probar.
        let chatName = username + (initialRank === 'Líder' ? ' (Admin)' : ' (Guest)');
        
        user = new UserProfile({ 
            username: username,
            chatname: chatName, // <--- Este es el campo nuevo
            passwordHash: 'no_pass', 
            rank: initialRank 
        });
        await user.save();
    }
    // ... (El resto de la lógica)
    return { success: true, user: user };
};