const mongoose = require('mongoose');

const matchupSchema = new mongoose.Schema({
    counterHeroId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hero', required: true },
    enemyHeroId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hero', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    note: { type: String },
    counterItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    // MỚI CỰC KỲ QUAN TRỌNG: Gắn với ID của người tạo ra kèo này
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } 
}, { timestamps: true });

matchupSchema.index({ enemyHeroId: 1 });
matchupSchema.index({ counterHeroId: 1 });
matchupSchema.index({ author: 1 }); // Đánh index để lọc theo User nhanh hơn

module.exports = mongoose.model('Matchup', matchupSchema);