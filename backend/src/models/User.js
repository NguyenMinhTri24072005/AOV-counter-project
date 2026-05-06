const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Sẽ được mã hóa
    role: { type: String, enum: ['admin', 'user'], default: 'user' } // Phân quyền
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);