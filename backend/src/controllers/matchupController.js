const Matchup = require('../models/Matchup')

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
        const { enemyIds = [], excludedIds = [], mode = 'standard', userId = null } = req.body;
        
        // 1. Khởi tạo Object query rỗng
        let query = {};

        // 2. Xây dựng bộ lọc Author dựa trên Mode
        const Admin = await require('../models/User').findOne({ role: 'admin' });
        const adminId = Admin?._id;

        if (mode === 'standard') {
            query.author = adminId;
        } else if (mode === 'custom') {
            query.author = userId;
        } else if (mode === 'compare') {
            query.author = { $in: [adminId, userId] };
        }
        // Nếu mode là 'pro', chúng ta không đặt query.author để lấy TOÀN BỘ kèo.

        // 3. FIX LỖI TẠI ĐÂY: Chỉ lọc theo enemyHeroId nếu mảng enemyIds thực sự có phần tử
        if (enemyIds && enemyIds.length > 0) {
            query.enemyHeroId = { $in: enemyIds };
        }

        // 4. Tìm kèo với bộ lọc đã được xử lý chuẩn
        const matchups = await Matchup.find(query)
            .populate('counterHeroId', 'name avatar role')
            .populate('counterItems', 'name icon passive')
            .populate('author', 'username role');

        const counterMap = {};
        matchups.forEach(match => {
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
            match.counterItems.forEach(item => counterMap[counterId].recommendedItems.add(item));

            // Gom nhóm chi tiết các tướng bị khắc chế
            counterMap[counterId].matchupDetails.push({
                _id: match._id,
                enemyId: match.enemyHeroId,
                score: match.score,
                note: match.note,
                // BỔ SUNG DÒNG NÀY ĐỂ LẤY ITEM CHO TÍNH NĂNG EDIT
                counterItems: match.counterItems ? match.counterItems.map(i => i._id || i) : [], 
                authorName: match.author?.username || 'Người dùng ẩn danh',
                authorId: match.author?._id,
                isSystem: match.author?.role === 'admin'
            });
        });

        const sortedCounters = Object.values(counterMap)
            .map(c => ({ ...c, recommendedItems: Array.from(c.recommendedItems) }))
            .sort((a, b) => b.totalScore - a.totalScore);
            
        res.status(200).json(sortedCounters);
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