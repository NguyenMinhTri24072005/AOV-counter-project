const mongoose = require('mongoose');

const itemCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true } // VD: Công, Phép, Thủ
}, { timestamps: true });

module.exports = mongoose.model('ItemCategory', itemCategorySchema);