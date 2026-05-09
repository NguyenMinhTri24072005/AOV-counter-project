require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const heroRoutes = require('./routes/herroRoutes');
const itemRoutes = require('./routes/itemRoutes');
const matchupRoutes = require('./routes/matchupRoutes');
const roleRoutes = require('./routes/roleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const strategyRoutes = require('./routes/strategyRoutes');
const userRoutes = require('./routes/userRoutes')

const app = express();

app.use(cors());
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