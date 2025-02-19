const express = require('express');
const router = express.Router();
const Token = require('../controller/Token');

// 刷新token
router.post('/refresh', Token.refresh);

module.exports = router; 