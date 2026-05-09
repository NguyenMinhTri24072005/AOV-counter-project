const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
    // Phân loại: Kèo kỹ năng (skill_matchup), Kết hợp (synergy), Đội hình khắc chế (combo_counter)
    type: { 
        type: String, 
        enum: ['skill_matchup', 'synergy', 'combo_counter'], 
        required: true 
    },
    
    // Đội A (Có thể là 1 tướng hoặc 1 combo 2-5 tướng)
    teamA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hero', required: true }],
    
    // Đội B (Đối đầu. Nếu type là 'synergy' thì teamB có thể rỗng)
    teamB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hero' }],
    score: { type: Number, required: true, min: 1, max: 5, default: 5 },
    
    note: { type: String, required: true },
    
    // Trang bị khuyên dùng cho cả đội hình/combo này
    counterItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    visibility: { 
        type: String, 
        enum: ['public', 'private'], 
        default: 'public' 
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Tạo index để truy xuất nhanh khi tìm mảng tướng
strategySchema.index({ teamA: 1 });
strategySchema.index({ teamB: 1 });
strategySchema.index({ author: 1 });

module.exports = mongoose.model('Strategy', strategySchema);