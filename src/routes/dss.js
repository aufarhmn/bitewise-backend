const router = require('express').Router();

const { scoringMethod, topsisMethod } = require('../controllers/dss');

router.post('/scoring', scoringMethod);
router.post('/topsis', topsisMethod);

module.exports = router;