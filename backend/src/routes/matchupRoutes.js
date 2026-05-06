const express = require('express')
const router = express.Router();
const matchupController = require('../controllers/matchupController')

router.post('/', matchupController.createMatchup);
router.post('/recommed', matchupController.getRecommendations)

module.exports = router;