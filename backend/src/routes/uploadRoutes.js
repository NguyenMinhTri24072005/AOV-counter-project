const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Thư viện xử lý file/thư mục mặc định của Node.js

// 1. Xác định đường dẫn tuyệt đối đến thư mục 'uploads'
// __dirname đang ở backend/src/routes -> lùi 2 cấp (../../) sẽ ra thư mục backend/ -> vào thư mục uploads/
const uploadDir = path.join(__dirname, '../../uploads');

// 2. CHỐNG LỖI 500: Tự động tạo thư mục uploads nếu nó chưa tồn tại
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Đã tự động tạo thư mục chứa ảnh: ', uploadDir);
}

// 3. Cấu hình Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Sử dụng đường dẫn tuyệt đối đã cấu hình ở trên
    },
    filename: (req, file, cb) => {
        // Đổi tên file để tránh trùng lặp: Timestamp_hiệntại.đuôifile
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// 4. API nhận file ảnh
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (req.file) {
            console.log('📸 Đã upload ảnh thành công:', req.file.filename);
            res.json({ url: `/uploads/${req.file.filename}` });
        } else {
            res.status(400).json({ message: "Không tìm thấy file tải lên!" });
        }
    } catch (error) {
        console.error('❌ Lỗi upload:', error);
        res.status(500).json({ message: "Lỗi Server khi upload ảnh: " + error.message });
    }
});

module.exports = router;