const Role = require('../models/Role');

const getRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy Role: ' + error.message });
    }
};

module.exports = { getRoles };
