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
        const { 
            mode = 'standard', userId = null, currentUserId = null, 
            page = 1, limit = 20, 
            searchTerm = '', matchingNameHeroIds = [], 
            requiredHeroIds = [], hasRoleOrLaneFilter = false 
        } = req.body;
        
        const visibilityConditions = [
            { visibility: 'public' },
            { visibility: { $exists: false } } 
        ];

        if (currentUserId) {
            visibilityConditions.push({ author: currentUserId });
        }

        const query = {
            $and: [ { $or: visibilityConditions } ]
        };

        const Admin = await User.findOne({ role: 'admin' });
        const adminId = Admin?._id;
        
        const authorQuery = {};

        if (mode === 'standard' && adminId) {
            authorQuery.author = adminId;
        } else if (mode === 'custom' && userId) {
            authorQuery.author = userId;
        } else if (mode === 'compare') {
            authorQuery.author = { $in: [adminId, userId].filter(Boolean) }; 
        } else if (mode === 'community' && adminId) {
            authorQuery.author = { $ne: adminId }; 
        }

        if (Object.keys(authorQuery).length > 0) {
            query.$and.push(authorQuery);
        }

        // --- BỘ LỌC TÌM KIẾM BẰNG REGEX & TỐI ƯU ID TƯỚNG ---
        const searchConditions = [];

        if (searchTerm) {
            searchConditions.push({
                $or: [
                    { note: { $regex: searchTerm, $options: 'i' } },
                    { teamA: { $in: matchingNameHeroIds } },
                    { teamB: { $in: matchingNameHeroIds } }
                ]
            });
        }

        if (hasRoleOrLaneFilter) {
            if (requiredHeroIds.length > 0) {
                searchConditions.push({
                    $or: [
                        { teamA: { $in: requiredHeroIds } },
                        { teamB: { $in: requiredHeroIds } }
                    ]
                });
            } else {
                // Nếu Frontend lọc Role/Lane nhưng không có tướng nào khớp, chặn kết quả
                searchConditions.push({ _id: null }); 
            }
        }

        if (searchConditions.length > 0) {
            query.$and.push(...searchConditions);
        }
        // ----------------------------------------------------

        const skip = (page - 1) * limit;
        const totalItems = await Strategy.countDocuments(query);

        const strategies = await Strategy.find(query)
            .populate('teamA', 'name avatar roles lane') 
            .populate('teamB', 'name avatar roles lane')
            .populate('counterItems', 'name icon passive price') 
            .populate('author', 'username role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedStrategies = strategies.map(strat => {
            const stratObj = strat.toObject();
            stratObj.isSystem = stratObj.author?.role === 'admin';
            return stratObj;
        });

        res.status(200).json({
            success: true,
            data: formattedStrategies,
            pagination: {
                totalItems,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit),
                limit: parseInt(limit)
            }
        });
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