const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit'); // 🌟 THÊM RATE LIMIT

// 1. Trạm kiểm soát Đăng nhập (Chống dò mật khẩu Brute-force)
// 1. Trạm kiểm soát Đăng nhập (Chống dò mật khẩu Brute-force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Bạn có thể chỉnh 15 phút hoặc 5 phút ở đây
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    // 🌟 THÊM HANDLER ĐỂ ĐỒNG BỘ THỜI GIAN VỚI FRONTEND
    handler: (req, res, next, options) => {
        // Tính toán chính xác số giây còn lại cho đến khi được mở khóa
        const timeRemaining = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
        
        res.status(options.statusCode).json({
            // Tự động đổi chữ "phút" theo thời gian thực tế
            message: `⚠️ Đăng nhập sai quá nhiều lần. Hệ thống tạm khóa ${Math.ceil(timeRemaining / 60)} phút!`,
            // Truyền trực tiếp số giây xuống Frontend
            lockoutTime: timeRemaining 
        });
    }
});

// 2. Trạm kiểm soát Quên mật khẩu (Chống spam API gửi Email)
const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 3, // Chỉ cho phép gửi yêu cầu OTP tối đa 3 lần / 1 giờ
    message: { message: '⚠️ Bạn đã yêu cầu gửi mã quá nhiều lần. Vui lòng kiểm tra hộp thư hoặc thử lại sau 1 giờ.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', authController.register);

// 🌟 Gắn trạm kiểm soát vào route login
router.post('/login', loginLimiter, authController.login);

// 🌟 Gắn trạm kiểm soát vào route forgot-password
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

module.exports = router;