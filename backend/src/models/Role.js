const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // VD: Đấu sĩ, Sát thủ
    description: { type: String },
    icon: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);