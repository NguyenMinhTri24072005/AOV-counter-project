const Item = require('../models/Item');

// [POST] Thêm trang bị mới vào hệ thống
const createItem = async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm trang bị: ' + error.message });
    }
};

// [GET] Lấy danh sách tất cả trang bị (để Frontend làm menu chọn)
const getAllItems = async (req, res) => {
    try {
        const items = await Item.find().sort({ name: 1 }); // Sắp xếp theo thứ tự chữ cái A-Z
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách trang bị: ' + error.message });
    }
};

module.exports = { createItem, getAllItems };