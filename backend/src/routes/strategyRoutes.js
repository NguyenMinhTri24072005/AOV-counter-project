const express = require('express');
const router = express.Router();
// Đã import trực tiếp updateStrategy ở đây
const { createStrategy, getStrategies, getMyStrategies, deleteStrategy, updateStrategy } = require('../controllers/strategyController');
const { verifyToken } = require('../middleware/auth'); 

// Lấy danh sách tổng hợp (Không bắt buộc đăng nhập để xem hệ thống/cộng đồng)
router.post('/filter', getStrategies);

// Các route cần xác thực (verifyToken)
router.post('/', verifyToken, createStrategy);
router.get('/my/:userId', verifyToken, getMyStrategies);
router.delete('/:id', verifyToken, deleteStrategy);

// ĐÃ SỬA LẠI DÒNG NÀY: Gọi trực tiếp updateStrategy
router.put('/:id', verifyToken, updateStrategy);

module.exports = router;