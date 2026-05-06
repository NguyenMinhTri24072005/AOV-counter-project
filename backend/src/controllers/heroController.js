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

module.exports = { createHero, getAllHeroes };