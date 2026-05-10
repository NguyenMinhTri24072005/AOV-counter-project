const Matchup = require('../models/Matchup')
const User = require('../models/User')

const createMatchup = async (req, res) => {
    try {
        const newMatchup = new Matchup(req.body);
        const savedMatchup = await newMatchup.save();
        res.status(201).json(savedMatchup)
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo kèo đấu: ' + error.message })
    }
}

const getRecommendations = async (req, res) => {
    try {
        const { 
            enemyIds = [], excludedIds = [], mode = 'standard', userId = null, 
            page = 1, limit = 20,
            searchTerm = '', matchingNameHeroIds = [], requiredHeroIds = [], hasRoleOrLaneFilter = false
        } = req.body;

        let query = {};
        const Admin = await User.findOne({ role: 'admin' });
        const adminId = Admin?._id;

        // Xử lý Mode hiển thị (Của tôi, Hệ thống, Cộng đồng)
        if (mode === 'standard' && adminId) {
            query.author = adminId;
        } else if (mode === 'custom' && userId) {
            query.author = userId;
        } else if (mode === 'compare') {
            query.author = { $in: [adminId, userId].filter(Boolean) };
        } else if (mode === 'community' && adminId) {
            query.author = { $ne: adminId };
        }

        if (enemyIds && enemyIds.length > 0) {
            query.enemyHeroId = { $in: enemyIds };
        }

        // --- BỘ LỌC TÌM KIẾM BẰNG REGEX ---
        const searchConditions = [];
        if (searchTerm) {
            searchConditions.push({
                $or: [
                    { note: { $regex: searchTerm, $options: 'i' } },
                    { enemyHeroId: { $in: matchingNameHeroIds } },
                    { counterHeroId: { $in: matchingNameHeroIds } }
                ]
            });
        }

        if (hasRoleOrLaneFilter) {
            if (requiredHeroIds.length > 0) {
                // Chỉ tìm các kèo mà tướng Khắc Chế (Tướng của mình) khớp với Role/Lane
                searchConditions.push({ counterHeroId: { $in: requiredHeroIds } });
            } else {
                searchConditions.push({ _id: null }); // Ép rỗng nếu không khớp
            }
        }

        if (searchConditions.length > 0) {
            query.$and = searchConditions;
        }
        // ------------------------------------

        // Tính toán phân trang Backend
        const skip = (page - 1) * limit;
        const totalItems = await Matchup.countDocuments(query);

        const matchups = await Matchup.find(query)
            .populate('counterHeroId', 'name avatar roles lane')
            .populate('enemyHeroId', 'name avatar') 
            .populate('counterItems', 'name icon passive')
            .populate('author', 'username role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Gom nhóm (Group) các kèo khắc chế cho Frontend dễ hiển thị
        const counterMap = {};
        matchups.forEach(match => {
            if (!match.counterHeroId) return; 
            const counterId = match.counterHeroId._id.toString();
            if (excludedIds.includes(counterId)) return;

            if (!counterMap[counterId]) {
                counterMap[counterId] = {
                    hero: match.counterHeroId,
                    totalScore: 0,
                    recommendedItems: new Set(),
                    matchupDetails: []
                };
            }

            counterMap[counterId].totalScore += match.score;
            if(match.counterItems) {
                match.counterItems.forEach(item => counterMap[counterId].recommendedItems.add(item));
            }

            counterMap[counterId].matchupDetails.push({
                _id: match._id,
                enemyId: match.enemyHeroId?._id || match.enemyHeroId,
                score: match.score,
                note: match.note,
                counterItems: match.counterItems ? match.counterItems.map(i => i._id || i) : [], 
                authorName: match.author?.username || 'Người chơi',
                authorId: match.author?._id,
                isSystem: match.author?.role === 'admin'
            });
        });

        const sortedCounters = Object.values(counterMap)
            .map(c => ({ ...c, recommendedItems: Array.from(c.recommendedItems) }))
            .sort((a, b) => b.totalScore - a.totalScore);

        // Trả về kèm Meta Phân Trang
        res.status(200).json({
            success: true,
            data: sortedCounters,
            pagination: {
                totalItems,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xử lý: ' + error.message });
    }
};

const getMyMatchups = async (req, res) => {
    try {
        const matchups = await Matchup.find({ author: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json(matchups);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteMatchup = async (req, res) => {
    try {
        await Matchup.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa kèo" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateMatchup = async (req, res) => {
    try {
        const updatedMatchup = await Matchup.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedMatchup);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createMatchup, getRecommendations, getMyMatchups, deleteMatchup, updateMatchup };