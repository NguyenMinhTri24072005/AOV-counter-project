const Strategy = require('../models/Strategy');
const User = require('../models/User');

const createStrategy = async (req, res) => {
    try {
        const newStrategy = new Strategy(req.body);
        const savedStrategy = await newStrategy.save();
        res.status(201).json(savedStrategy);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo chiến thuật: ' + error.message });
    }
};


const getStrategies = async (req, res) => {
    try {
        // Nhận toàn bộ từ req.body (Vì route của bạn là POST /filter)
        const { mode = 'standard', userId = null, currentUserId = null } = req.body;
        
        // 1. XÂY DỰNG ĐIỀU KIỆN QUYỀN RIÊNG TƯ
        // Phải là công khai HOẶC là dữ liệu cũ chưa có trường này
        const visibilityConditions = [
            { visibility: 'public' },
            { visibility: { $exists: false } } 
        ];

        // Nếu người dùng đang đăng nhập, cho phép họ xem thêm chiến thuật private của chính họ
        if (currentUserId) {
            visibilityConditions.push({ author: currentUserId });
        }

        // Khởi tạo query với điều kiện BẮT BUỘC về quyền riêng tư
        const query = {
            $and: [ { $or: visibilityConditions } ]
        };

        // 2. XỬ LÝ BỘ LỌC THEO NGUỒN (Hệ thống / Cá nhân / Cộng đồng)
        const Admin = await User.findOne({ role: 'admin' });
        const adminId = Admin?._id;
        
        const authorQuery = {};

        if (mode === 'standard' && adminId) {
            authorQuery.author = adminId;
        } else if (mode === 'custom' && userId) {
            authorQuery.author = userId;
        } else if (mode === 'compare') {
            // Dùng filter(Boolean) để lọc bỏ nếu userId hoặc adminId bị null
            authorQuery.author = { $in: [adminId, userId].filter(Boolean) }; 
        } else if (mode === 'community' && adminId) {
            authorQuery.author = { $ne: adminId }; 
        }

        // Nếu có điều kiện về tác giả thì nhét thêm vào $and để gộp chung với quyền riêng tư
        if (Object.keys(authorQuery).length > 0) {
            query.$and.push(authorQuery);
        }

        // 3. THỰC THI TRUY VẤN VÀ LẤY DỮ LIỆU ĐẦY ĐỦ
        const strategies = await Strategy.find(query)
            // SỬA LỖI: Tên trường trong Model là 'roles' (có s) và thêm 'lane'
            .populate('teamA', 'name avatar roles lane') 
            .populate('teamB', 'name avatar roles lane')
            // Thêm giá tiền (price) để Modal hiển thị giá trang bị chuẩn xác
            .populate('counterItems', 'name icon passive price') 
            .populate('author', 'username role')
            .sort({ createdAt: -1 });

        // 4. GẮN CỜ NHẬN DIỆN CHO FRONTEND
        const formattedStrategies = strategies.map(strat => {
            const stratObj = strat.toObject();
            stratObj.isSystem = stratObj.author?.role === 'admin';
            return stratObj;
        });

        res.status(200).json(formattedStrategies);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xử lý lấy chiến thuật: ' + error.message });
    }
};

const getMyStrategies = async (req, res) => {
    try {
        const strategies = await Strategy.find({ author: req.params.userId })
            .populate('teamA', 'name avatar role')
            .populate('teamB', 'name avatar role')
            .populate('counterItems', 'name icon')
            .sort({ createdAt: -1 });
        res.status(200).json(strategies);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};

const deleteStrategy = async (req, res) => {
    try {
        await Strategy.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa chiến thuật nâng cao" });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};
const updateStrategy = async (req, res) => {
    try {
        const updatedStrategy = await Strategy.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedStrategy);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createStrategy, getStrategies, getMyStrategies, deleteStrategy, updateStrategy };