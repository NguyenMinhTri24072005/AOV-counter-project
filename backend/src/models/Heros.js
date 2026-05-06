const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
    name: { type: String, required: true }, // unique: true giúp chống nhập trùng tên tướng
    role: { type: String, required: true },
    lane: [{ type: String, required: true }],
    avatar: { type: String },
    tags: [{ type: String }]
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model("Hero", heroSchema);