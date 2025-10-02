const messageService = require('../services/messageService');
const { broadcast } = require('../websocket');
const { getTimestamp } = require('../config/constants'); 

exports.handleChatMessage = async (senderData, incomingData) => {
    const messageId = Date.now().toString(); // ID único

    const messageData = {
        id: messageId,
        name: senderData.chatname,
        text: incomingData.text,
        rank: senderData.rank,
        color: senderData.color,
        avatarUrl: senderData.avatarUrl,
        timestamp: getTimestamp()
    };
    
    // 1. Guardar en la base de datos (solo mensajes públicos)
    await messageService.saveMessage(messageData);

    // 2. Transmitir a todos
    broadcast({ type: 'chat', data: messageData });
};