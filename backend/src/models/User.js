const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Sẽ được mã hóa
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }, // Phân quyền
    resetPasswordToken: String, // Dùng cho chức năng quên mật khẩu
    resetPasswordExpires: Date,
    resetPasswordOtp: { type: String }, // Mã OTP 6 số
    resetPasswordOtpExpires: { type: Date } // Thời hạn sống của mã
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);