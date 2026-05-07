const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    icon: { type: String, default: '' }, // <-- THÊM TRƯỜNG NÀY ĐỂ LƯU ẢNH TRANG BỊ
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemCategory' },
    tier: { type: Number, default: 3 },
    price: { type: Number, default: 0 },
    passive: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);