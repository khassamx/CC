exports.PORT = 8080;
exports.MONGODB_URI = 'mongodb://localhost:27017/chat_db';
exports.MODERATOR_RANKS = ['Fundador', 'Líder', 'Colíder'];
exports.MAX_HISTORY_LOAD = 100;

// Utilidades para backend
exports.getTimestamp = () => { 
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};