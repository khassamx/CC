// ... (imports)
const UserProfileSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true }, // <-- CLAVE DE SEGURIDAD
    chatname: String, // Persiste el nombre de chat
    rank: { type: String, default: 'Miembro' },
    avatarUrl: String,
    lastActive: { type: Date, default: Date.now }
});
// ... (export)