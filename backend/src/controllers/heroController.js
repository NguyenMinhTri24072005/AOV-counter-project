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
        // 1. Nhận page và limit từ query (Mặc định trang 1, mỗi trang 20 tướng)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // 2. Tính toán số lượng bỏ qua
        const skip = (page - 1) * limit;

        // 3. Tìm dữ liệu theo phân trang
        const heroes = await Hero.find()
            .populate('roles')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        // 4. Đếm tổng số lượng tướng để chia trang
        const total = await Hero.countDocuments();

        // 5. Trả về format chuẩn bao gồm cả thông tin phân trang
        res.status(200).json({
            data: heroes,
            pagination: {
                totalItems: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                limit: limit
            }
        });
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
