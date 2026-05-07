require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối Database thành công!');

        // Kiểm tra xem đã có tài khoản admin nào tên 'admin' chưa
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('⚠️ Tài khoản Admin đã tồn tại! (User: admin)');
            process.exit(0);
        }

        // Tạo tài khoản admin mới
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash('admin123', salt);
        
        await User.create({
            username: 'admin',
            password: hashedAdminPassword,
            role: 'admin'
        });

        console.log('👑 Đã tạo thành công tài khoản Admin!');
        console.log('👉 Username: admin');
        console.log('👉 Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi tạo Admin:', error);
        process.exit(1);
    }
};

createAdmin();