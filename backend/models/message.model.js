const mongoose = require('mongoose'); // <--- CORRECCIÓN NECESARIA

const messageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: String,
    text: String,
    rank: String,
    color: String,
    isDM: { type: Boolean, default: false },
    timestamp: String,
    createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Message', messageSchema);