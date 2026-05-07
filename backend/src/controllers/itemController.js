const Item = require('../models/Item');

const createItem = async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm trang bị: ' + error.message });
    }
};

const getAllItems = async (req, res) => {
    try {
        // THÊM .populate('category') để lấy được thông tin từ bảng Category
        const items = await Item.find().populate('category').sort({ name: 1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi: ' + error.message });
    }
};

const updateItem = async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedItem);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteItem = async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa Trang bị" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createItem, getAllItems, updateItem, deleteItem };