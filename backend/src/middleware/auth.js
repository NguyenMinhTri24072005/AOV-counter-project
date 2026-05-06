const jwt = require('jsonwebtoken');

// Middleware này sẽ chặn ở các API cần bảo mật. Có Token hợp lệ mới cho đi tiếp.
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Lấy token từ header "Bearer <token>"

    if (!token) return res.status(401).json({ message: 'Từ chối truy cập. Vui lòng đăng nhập!' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Gắn thông tin user (id, role) vào req để các controller sau dùng
        next();
    } catch (error) {
        res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

module.exports = { verifyToken };