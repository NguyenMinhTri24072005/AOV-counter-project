const Hero = require('../models/Heros')

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
        const heroes = await Hero.find().sort({ name: 1 }); // Sắp xếp theo tên A-Z
        res.status(200).json(heroes);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách tướng: ' + error.message });
    }
};

const updateHero = async (req, res) => {
    try {
        const updatedHero = await Hero.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedHero);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteHero = async (req, res) => {
    try {
        await Hero.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa Tướng" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createHero, getAllHeroes, updateHero, deleteHero };
