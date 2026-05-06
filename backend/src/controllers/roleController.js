const Role = require('../models/Role');

const getRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createRole = async (req, res) => {
    try {
        const newRole = new Role(req.body);
        const savedRole = await newRole.save();
        res.status(201).json(savedRole);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteRole = async (req, res) => {
    try {
        await Role.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa Vai trò" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getRoles, createRole, deleteRole };