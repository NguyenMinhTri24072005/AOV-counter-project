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
        const { mode = 'standard', userId = null } = req.body;
        let query = {};

        // Xử lý bộ lọc theo Nguồn (Hệ thống / Cá nhân / Cộng đồng)
        const Admin = await User.findOne({ role: 'admin' });
        const adminId = Admin?._id;

        if (mode === 'standard') {
            query.author = adminId;
        } else if (mode === 'custom') {
            query.author = userId;
        } else if (mode === 'compare') {
            query.author = { $in: [adminId, userId] };
        } else if (mode === 'community') {
            query.author = { $ne: adminId }; // Lấy tất cả trừ Admin
        }
        // mode === 'pro' sẽ không có query.author -> Lấy TOÀN BỘ

        const strategies = await Strategy.find(query)
            .populate('teamA', 'name avatar role')
            .populate('teamB', 'name avatar role')
            .populate('counterItems', 'name icon passive')
            .populate('author', 'username role')
            .sort({ createdAt: -1 });

        // Gắn thêm cờ isSystem để Frontend dễ xử lý
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

module.exports = { createStrategy, getStrategies, getMyStrategies, deleteStrategy };