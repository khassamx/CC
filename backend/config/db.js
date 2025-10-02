const mongoose = require('mongoose');
const { MONGODB_URI } = require('./constants');

exports.connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conexión a MongoDB exitosa.');
    } catch (err) {
        console.error('❌ Error de conexión a MongoDB:', err);
        process.exit(1);
    }
};