const Hero = require('../models/Heros')
const Matchup = require('../models/Matchup');
const Strategy = require('../models/Strategy');

const createHero = async (req, res) => {
    try {
        const newHero = new Hero(req.body);
        const savedHero = await newHero.save();
        res.status(201).json(savedHero)
    } catch (error) {
        res.status(500).json({
            message: "lỗi khi thêm tướng: " + error.messase
        })
    }
}

const getAllHeroes = async (req, res) => {
    try {
        // THÊM .populate('roles') để lấy được tên các vai trò
        const heroes = await Hero.find().populate('roles').sort({ name: 1 });
        res.status(200).json(heroes);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi: ' + error.message });
    }
};

const updateHero = async (req, res) => {
    try {
        // Thay { new: true } thành { returnDocument: 'after' }
        const updatedHero = await Hero.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.status(200).json(updatedHero);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};

const deleteHero = async (req, res) => {
    try {
        const heroId = req.params.id;
        // 1. Xóa tất cả Matchup liên quan (dù là tướng khắc chế hay tướng bị khắc chế)
        await Matchup.deleteMany({
            $or: [{ counterHeroId: heroId }, { enemyHeroId: heroId }]
        });
        // 2. Xóa tất cả Chiến thuật nâng cao chứa tướng này trong teamA hoặc teamB
        await Strategy.deleteMany({
            $or: [{ teamA: heroId }, { teamB: heroId }]
        });
        // 3. Cuối cùng mới xóa tướng
        const deletedHero = await Hero.findByIdAndDelete(heroId);
        if (!deletedHero) {
            return res.status(404).json({ message: "Không tìm thấy tướng để xóa" });
        }
        res.status(200).json({ message: "Đã xóa tướng và toàn bộ dữ liệu liên quan thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createHero, getAllHeroes, updateHero, deleteHero };
