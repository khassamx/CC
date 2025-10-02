const Message = require('../models/message.model');
const { MAX_HISTORY_LOAD } = require('../config/constants');

exports.saveMessage = async (data) => {
    try {
        const newMessage = new Message(data);
        await newMessage.save();
        return newMessage;
    } catch (error) {
        console.error('Error al guardar mensaje en DB:', error);
        return null;
    }
};

exports.loadHistory = async () => {
    try {
        const history = await Message.find()
            .sort({ createdAt: 1 }) // Orden ascendente
            .limit(MAX_HISTORY_LOAD)
            .exec();
        return history.map(msg => ({ ...msg._doc, type: 'chat', data: msg._doc }));
    } catch (error) {
        console.error('Error al cargar historial:', error);
        return [];
    }
};