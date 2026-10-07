const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const {
  citizenLoginSchema,
  loginSchema,
  demoLoginSchema,
  broadcastSchema,
} = require('../validators/authValidator');

router.post('/citizen-login', validateRequest(citizenLoginSchema), authController.citizenLogin);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/demo-login', validateRequest(demoLoginSchema), authController.demoLogin);
router.post('/broadcast', validateRequest(broadcastSchema), authController.broadcastAlert);
router.get('/responders', authController.getResponders);
router.get('/me', authController.getCurrentUser);

module.exports = router;
