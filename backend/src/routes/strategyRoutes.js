const express = require('express');
const router = express.Router();
const { createStrategy, getStrategies, getMyStrategies, deleteStrategy } = require('../controllers/strategyController');
const { verifyToken } = require('../middleware/auth'); // SỬA TẠI ĐÂY: Đổi protect thành verifyToken cho khớp với auth.js

// Lấy danh sách tổng hợp (Không bắt buộc đăng nhập để xem hệ thống/cộng đồng)
router.post('/filter', getStrategies);

// Các route cần xác thực (verifyToken)
router.post('/', verifyToken, createStrategy);
router.get('/my/:userId', verifyToken, getMyStrategies);
router.delete('/:id', verifyToken, deleteStrategy);

module.exports = router;