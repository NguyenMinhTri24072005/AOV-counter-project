const express = require('express')
const router = express.Router();
const heroController = require('../controllers/heroController');

router.post('/', heroController.createHero)
router.get('/', heroController.getAllHeroes)

module.exports = router;