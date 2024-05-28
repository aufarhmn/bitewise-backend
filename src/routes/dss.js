const router = require('express').Router();

const { scoringMethod } = require('../controllers/dss');

router.post('/scoring-method', scoringMethod);

module.exports = router;