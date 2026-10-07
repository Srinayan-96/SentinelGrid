const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const validateRequest = require('../middleware/validateRequest');
const { getMessagesSchema, sendMessageSchema } = require('../validators/messageValidator');
const authOptional = require('../middleware/authOptional');

router.get('/:incidentId', validateRequest(getMessagesSchema), messageController.getMessages);
router.post('/', authOptional, validateRequest(sendMessageSchema), messageController.sendMessage);

module.exports = router;
