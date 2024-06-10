const router = require('express').Router();

const { scoringMethod, topsisMethod, AHPMethod } = require('../controllers/dss');

router.post('/scoring', scoringMethod);
router.post('/topsis', topsisMethod);
router.post('/ahp', AHPMethod);

module.exports = router;