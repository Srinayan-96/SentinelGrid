const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/demo-login', authController.demoLogin);
router.post('/broadcast', authController.broadcastAlert);
router.get('/responders', authController.getResponders);

module.exports = router;
