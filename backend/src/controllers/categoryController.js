const ItemCategory = require('../models/ItemCategory');

const getCategories = async (req, res) => {
    try {
        const categories = await ItemCategory.find();
        res.status(200).json(categories);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createCategory = async (req, res) => {
    try {
        const newCategory = new ItemCategory(req.body);
        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteCategory = async (req, res) => {
    try {
        await ItemCategory.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa Phân loại" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getCategories, createCategory, deleteCategory };