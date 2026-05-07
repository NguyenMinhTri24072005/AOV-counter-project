const express = require('express')
const router = express.Router();
const matchupController = require('../controllers/matchupController')

router.post('/', matchupController.createMatchup);
router.post('/recommend', matchupController.getRecommendations)
router.get('/user/:userId', matchupController.getMyMatchups);
router.delete('/:id', matchupController.deleteMatchup);

module.exports = router;