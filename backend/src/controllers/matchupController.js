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
        // NHẬN THÊM excludedIds TỪ FRONTEND
        const { enemyIds, excludedIds = [] } = req.body; 

        const matchups = await Matchup.find({ enemyHeroId: { $in: enemyIds } })
            .populate('counterHeroId', 'name avatar role')
            .populate('counterItems', 'name avatar passive');

        const counterMap = {};

        matchups.forEach(match => {
            const counterId = match.counterHeroId._id.toString();

            if (excludedIds.includes(counterId)) {
                return; 
            }

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
                note: match.note
            });
        });

        const sortedCounters = Object.values(counterMap)
            .map(c => ({ 
                ...c, 
                recommendedItems: Array.from(c.recommendedItems)
            }))
            .sort((a, b) => b.totalScore - a.totalScore);

        res.status(200).json(sortedCounters);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xử lý kèo đấu: ' + error.message });
    }
};

module.exports = {createMatchup, getRecommendations };