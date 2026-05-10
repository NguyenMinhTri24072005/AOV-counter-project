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
        // Nhận thêm page và limit từ Frontend
        const { enemyIds = [], excludedIds = [], mode = 'standard', userId = null, page = 1, limit = 20 } = req.body;

        let query = {};
        const Admin = await User.findOne({ role: 'admin' });
        const adminId = Admin?._id;

        if (mode === 'standard') {
            query.author = adminId;
        } else if (mode === 'custom') {
            query.author = userId;
        } else if (mode === 'compare') {
            query.author = { $in: [adminId, userId].filter(Boolean) };
        }

        if (enemyIds && enemyIds.length > 0) {
            query.enemyHeroId = { $in: enemyIds };
        }

        // Tính toán phân trang
        const skip = (page - 1) * limit;
        
        let matchupsQuery = Matchup.find(query)
            .populate('counterHeroId', 'name avatar roles lane')
            .populate('enemyHeroId', 'name avatar') // Lấy thêm info địch
            .populate('counterItems', 'name icon passive')
            .populate('author', 'username role')
            .sort({ createdAt: -1 });

        let totalItems = 0;

        // Nếu là Admin tải dữ liệu Quản lý (mode = 'all') thì áp dụng phân trang Backend
        if (mode === 'all') {
            totalItems = await Matchup.countDocuments(query);
            matchupsQuery = matchupsQuery.skip(skip).limit(limit);
        }

        const matchups = await matchupsQuery.exec();

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

        // Trả về kèm theo Meta Data Phân Trang
        res.status(200).json({
            success: true,
            data: sortedCounters,
            pagination: mode === 'all' ? {
                totalItems,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit),
                limit: parseInt(limit)
            } : null
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