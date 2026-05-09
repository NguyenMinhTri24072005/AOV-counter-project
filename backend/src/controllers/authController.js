const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const register = async (req, res) => {
    try {
        // 🌟 SỬA TẠI ĐÂY: Thêm email vào req.body
        const { username, email, password, role } = req.body; 
        
        // Kiểm tra xem username HOẶC email đã tồn tại chưa
        const userExists = await User.findOne({ $or: [{ username }, { email }] });
        if (userExists) return res.status(400).json({ message: 'Tên đăng nhập hoặc Email đã tồn tại.' });

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Lưu user kèm email
        const newUser = new User({ username, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: 'Tạo tài khoản thành công!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Tên đăng nhập không đúng.' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ message: 'Mật khẩu không đúng.' });

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } 
        );

        res.status(200).json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: "Email không tồn tại trong hệ thống!" });

        // Tạo mã OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const message = `Bạn đã yêu cầu khôi phục mật khẩu.\n\nMã OTP của bạn là: ${otp}\n\nMã này sẽ hết hạn sau 10 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.`;
        
        await sendEmail({ email: user.email, subject: 'Mã khôi phục mật khẩu - AOV Counter', message });

        res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi gửi email: " + error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ 
            email, 
            resetPasswordOtp: otp,
            resetPasswordOtpExpires: { $gt: Date.now() } 
        });

        if (!user) return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn!" });

        res.status(200).json({ message: "Xác thực OTP thành công! Vui lòng nhập mật khẩu mới." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email, resetPasswordOtp: otp });

        if (!user) return res.status(400).json({ message: "Yêu cầu không hợp lệ!" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Mật khẩu đã được khôi phục thành công! Bạn có thể đăng nhập ngay." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🌟 SỬA TẠI ĐÂY: Export toàn bộ các hàm ra ngoài
module.exports = { register, login, forgotPassword, verifyOtp, resetPassword };