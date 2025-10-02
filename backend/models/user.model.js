const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    chatname: String,
    rank: { type: String, default: 'Miembro' },
    avatarUrl: String,
    lastActive: { type: Date, default: Date.now } // Nuevo: Para saber si está inactivo
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);