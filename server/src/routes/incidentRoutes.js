const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const auth = require('../utils/auth');

router.post('/', incidentController.createIncident);
router.get('/', incidentController.getIncidents);
router.post('/:incidentId/accept', auth, incidentController.acceptIncident);

module.exports = router;
