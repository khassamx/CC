const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    chatname: String,
    rank: { type: String, default: 'Miembro' },
    avatarUrl: String,
    // Aquí irían el XP, moneda, etc.
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);