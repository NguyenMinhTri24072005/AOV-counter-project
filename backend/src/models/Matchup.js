const mongoose = require('mongoose')

const matchupSchema = new mongoose.Schema({
    counterHeroId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hero',
        required: true
    },
    enemyHeroId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hero',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    note: {
        type: String
    },
    counterItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
    }]
}, {timestamps: true})

matchupSchema.index({enemyHeroId: 1})
matchupSchema.index({counterHeroId: 1})

module.exports = mongoose.model('Matchup', matchupSchema);