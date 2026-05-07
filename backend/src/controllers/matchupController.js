const Matchup = require('../models/Matchup')

const createMatchup = async (req,res) => {
    try {
        const newMatchup = new Matchup(req.body);
        const savedMatchup = await newMatchup.save();
        res.status(201).json(savedMatchup)
    } catch (errror){
        res.status(500).json({message: 'lỗi khi tạo kèo đấu: ' + error.message})
    }
}


const getRecommendations = async (req, res) => {
    try {
        const { enemyIds, excludedIds = [], mode = 'standard', userId = null } = req.body;
        
        // 1. Xây dựng bộ lọc Author dựa trên Mode
        let authorFilter = {};
        
        // Giả sử bạn lấy được Admin ID từ DB hoặc Hardcode. 
        // Cách tốt nhất là tìm User có role 'admin'
        const Admin = await require('../models/User').findOne({ role: 'admin' });
        const adminId = Admin?._id;

        if (mode === 'standard') {
            authorFilter = { author: adminId };
        } else if (mode === 'custom') {
            authorFilter = { author: userId };
        } else if (mode === 'compare') {
            authorFilter = { author: { $in: [adminId, userId] } };
        }

        // 2. Tìm kèo với bộ lọc mở rộng
        const matchups = await Matchup.find({ 
            enemyHeroId: { $in: enemyIds },
            ...authorFilter 
        })
        .populate('counterHeroId', 'name avatar role')
        .populate('counterItems', 'name avatar passive')
        .populate('author', 'username role'); // Thêm thông tin tác giả

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
            
            counterMap[counterId].matchupDetails.push({
                enemyId: match.enemyHeroId,
                score: match.score,
                note: match.note,
                authorName: match.author.username, // Hiển thị ai là người khuyên kèo này
                isSystem: match.author.role === 'admin'
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

module.exports = {createMatchup, getRecommendations, getMyMatchups, deleteMatchup };