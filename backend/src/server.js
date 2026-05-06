require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const heroRoutes = require('./routes/herroRoutes');
const matchupRoutes = require('./routes/matchupRoutes');
const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const URI = process.env.MONGODB_URI;
mongoose.connect(URI)
    .then(() => console.log("Đã kết nối thành công với MongoDB"))
    .catch((err) => console.log("Lỗi kết nối với MongoDB: ", err));

app.get('/', (req, res) => {
    res.send('API Liên Quân Counter đang hoạt động!');
});

app.use('/api/heroes', heroRoutes);
app.use('/api/matchups', matchupRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/categories', categoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});