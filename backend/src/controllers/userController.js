const User = require('../models/User');
const bcrypt = require('bcryptjs');

// [GET] /api/users - Lấy toàn bộ danh sách (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Ẩn mật khẩu khi trả về
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// [GET] /api/users/profile - Lấy thông tin cá nhân của người đang đăng nhập
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// [PUT] /api/users/:id - Cập nhật thông tin (Dùng chung cho Admin sửa user hoặc User tự sửa mình)
// [PUT] /api/users/:id - Cập nhật thông tin
const updateUser = async (req, res) => {
    try {
        // 🌟 Bổ sung 'avatar' vào biến nhận dữ liệu
        const { username, email, role, password, avatar } = req.body; 
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        // Chỉ Admin mới được quyền đổi Role
        if (role && req.user.role === 'admin') {
            user.role = role;
        }

        user.username = username || user.username;
        user.email = email || user.email;

        // 🌟 NẾU CÓ TRUYỀN AVATAR LÊN THÌ LƯU VÀO DATABASE
        if (avatar !== undefined) {
            user.avatar = avatar;
        }

        // Nếu có nhập mật khẩu mới thì mã hóa lại
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await user.save();
        
        // Trả về dữ liệu mới
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: updatedUser.avatar // 🌟 Trả về cả avatar
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// [DELETE] /api/users/:id - Xóa tài khoản (Admin only)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

        // Chống tự xóa chính mình
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản của chính mình" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa người dùng thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thay đổi mật khẩu khi đang đăng nhập (Yêu cầu mật khẩu cũ)
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        // 1. Kiểm tra mật khẩu cũ có khớp không
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác!" });
        }

        // 2. Mã hóa và lưu mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllUsers, getProfile, updateUser, deleteUser, changePassword };
