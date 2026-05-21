const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../utils/auth');

router.post('/', auth, messageController.sendMessage);
router.get('/:incidentId', auth, messageController.getMessages);

module.exports = router;
