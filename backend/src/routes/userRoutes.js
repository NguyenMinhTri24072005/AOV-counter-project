const express = require('express');
const router = express.Router();
const { getAllUsers, getProfile, updateUser, deleteUser, changePassword } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// Middleware kiểm tra quyền Admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Quyền truy cập bị từ chối. Chỉ dành cho Admin." });
    }
};

// Route dành cho cá nhân người dùng
router.get('/profile', verifyToken, getProfile);
router.put('/change-password', verifyToken, changePassword);
router.put('/:id', verifyToken, updateUser); // User tự sửa hoặc Admin sửa

// Route dành riêng cho Admin
router.get('/', verifyToken, isAdmin, getAllUsers);
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;