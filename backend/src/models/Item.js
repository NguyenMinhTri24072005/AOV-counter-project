const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    type: {type: String},
    price: {type: Number},
    avatar: {type: String},
    passive: {type: String}
}, {timestamps: true})

module.exports = mongoose.model('Item', itemSchema)