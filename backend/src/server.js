require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet'); // 🌟 THÊM HELMET
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const heroRoutes = require('./routes/heroRoutes');
const itemRoutes = require('./routes/itemRoutes');
const matchupRoutes = require('./routes/matchupRoutes');
const roleRoutes = require('./routes/roleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const strategyRoutes = require('./routes/strategyRoutes');
const userRoutes = require('./routes/userRoutes')

const app = express();

// 1. KÍCH HOẠT HELMET: Bảo vệ HTTP Headers
app.use(helmet());
// Cấu hình Helmet để cho phép Frontend load ảnh từ thư mục /uploads của Backend
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// 2. CẤU HÌNH CORS (Danh sách trắng)
const allowedOrigins = [
    'http://localhost:5173', // Môi trường Dev (Vite)
    'https://ten-du-an-cua-ban.vercel.app' // Thay bằng link Vercel/Netlify thực tế sau khi deploy
];

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép các request không có origin (ví dụ: Postman) hoặc nằm trong danh sách trắng
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Domain này không được phép truy cập API!'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Cấp quyền truy cập thư mục ảnh (Thư mục uploads nằm ngoài src)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// FIX LỖI SẬP SERVER TẠI ĐÂY: Đã sửa lại đường dẫn require
app.use('/api/upload', require('./routes/uploadRoutes'));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Kết nối Database thành công!'))
    .catch((err) => console.log('Lỗi kết nối DB:', err));

app.use('/api/auth', authRoutes);
app.use('/api/heroes', heroRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/matchups', matchupRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy ở port ${PORT}`);
});