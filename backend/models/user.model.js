const mongoose = require('mongoose'); // <--- CORRECTO: Solo Mongoose

const UserProfileSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    chatname: String,
    rank: { type: String, default: 'Miembro' },
    avatarUrl: String,
    lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);