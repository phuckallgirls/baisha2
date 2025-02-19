const express = require('express');
const router = express.Router();
const Captcha = require('../controller/Captcha');

// 生成验证码
router.get('/generate', Captcha.generate);

// 验证验证码
router.get('/check', Captcha.check);

module.exports = router; 