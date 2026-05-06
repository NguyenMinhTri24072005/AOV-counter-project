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
        const { enemyHeroIds } = req.body;

        const matchups = await Matchup.find({enemyHeroId: { $in: enemyHeroIds}})
            .populate('counterHeroId', 'name avatar role lane')
            .populate('counterItems', 'name avatar passive')

        const counterMap = {};

        matchups.forEach(matchup => {
            const counterId = match.counterHeroId._id.toString();

            if (!counterMap[counterId]) {
                counterMap[counterId] = {
                    hero: matchup.counterHeroId,
                    totalScore: 0,
                    recommendedItems: new Set(),
                    matchupDetails: []
                }
            }

            counterMap[counterId].totalScore += matchup.score;

            matchup.counterItems.forEach(item => counterMap[counterId].recommendedItems.add(item));

            counterMap[counterId].matchupDetails.push({
                enemyId: matchup.enemyHeroId,
                score: matchup.score,
                note: matchup.note
            })
        })

        const sortedCounters = Object.values(counterMap)
            .map(c => ({
                ...c,
                recommendedItems: Array.from(c.recommendedItems)
            }))
            .sort((a, b) => b.totalScore - a.totalScore)
        
            res.status(200).json(sortedCounters)
    } catch (error) {
        res.status(500).json({message: "lỗi xử lý kèo đấu: " + error.message})
    }
}

module.exports = {createMatchup, getRecommendations };