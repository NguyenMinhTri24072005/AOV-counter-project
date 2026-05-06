const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    // SỬA ĐỔI: Tham chiếu đến ItemCategory
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemCategory' },
    // MỚI: Phân cấp trang bị 1, 2, 3
    tier: { type: Number, enum: [1, 2, 3], default: 3 }, 
    price: { type: Number },
    avatar: { type: String },
    passive: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);