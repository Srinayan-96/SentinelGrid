const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const validateRequest = require('../middleware/validateRequest');
const {
  createIncidentSchema,
  getIncidentsSchema,
  assignIncidentSchema,
  claimIncidentSchema,
  statusUpdateSchema,
  resolveIncidentSchema,
  citizenConfirmSchema,
  adminCompleteSchema,
} = require('../validators/incidentValidator');
const authOptional = require('../middleware/authOptional');
const { requireAuth } = require('../middleware/auth');

router.post('/', validateRequest(createIncidentSchema), incidentController.createIncident);
router.get('/', validateRequest(getIncidentsSchema), incidentController.getIncidents);
router.get('/:id', incidentController.getIncidentById);

router.patch('/:id/assign', validateRequest(assignIncidentSchema), incidentController.assignIncident);
router.patch('/:id/claim', authOptional, validateRequest(claimIncidentSchema), incidentController.claimIncident);
router.patch('/:id/status', validateRequest(statusUpdateSchema), incidentController.updateStatus);
router.patch('/:id/resolve', validateRequest(resolveIncidentSchema), incidentController.resolveIncident);
router.patch('/:id/citizen-confirm', validateRequest(citizenConfirmSchema), incidentController.citizenConfirm);
router.patch('/:id/admin-complete', validateRequest(adminCompleteSchema), incidentController.adminComplete);
router.post('/:id/escalate', incidentController.escalateIncident);

module.exports = router;
