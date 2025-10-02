const userService = require('../services/userService');
const messageService = require('../services/messageService');
const { broadcast } = require('../websocket');
const { getTimestamp, stringToColor } = require('../config/constants'); 

exports.handleJoin = async (ws, data, usersData, userId) => {
    // 1. Persistencia: Buscar/Crear el perfil en la DB
    const userProfile = await userService.findOrCreateUser(data);

    // 2. Almacenar datos en memoria (para uso rápido)
    const userData = {
        username: userProfile.username,
        chatname: userProfile.chatname,
        rank: userProfile.rank,
        avatarUrl: userProfile.avatarUrl,
        color: stringToColor(userProfile.chatname),
        ws: ws
    };
    usersData[userId] = userData;
    
    // 3. Cargar Historial y enviarlo al usuario
    const history = await messageService.loadHistory();
    ws.send(JSON.stringify({ type: 'history', data: history }));
    
    // 4. Notificación y Broadcast
    broadcast({ 
        type: 'chat', 
        data: { 
            name: 'Sistema', 
            text: `${userProfile.chatname} se ha unido.`, 
            rank: 'Sistema',
            timestamp: getTimestamp()
        } 
    });
    // Se necesita una función de broadcastUserList en websocket.js
};