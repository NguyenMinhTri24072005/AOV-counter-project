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
        await Hero.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa Tướng" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createHero, getAllHeroes, updateHero, deleteHero };
