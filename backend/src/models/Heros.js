const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    // SỬA ĐỔI: Role bây giờ là mảng tham chiếu đến bảng Role (Một tướng có thể có nhiều Role)
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }], 
    lane: [{ type: String, required: true }],
    avatar: { type: String },
    tags: [{ type: String }],
    // MỚI: Thêm bộ kỹ năng
    skills: {
        passive: { type: String },
        skill1: { type: String },
        skill2: { type: String },
        skill3: { type: String },
        skill4: { type: String } // Một số tướng như Yena/Superman có skill 4
    }
}, { timestamps: true });

module.exports = mongoose.model("Hero", heroSchema);