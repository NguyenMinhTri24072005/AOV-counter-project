const ItemCategory = require('../models/ItemCategory');

const getCategories = async (req, res) => {
    try {
        const categories = await ItemCategory.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy Category: ' + error.message });
    }
};

module.exports = { getCategories };