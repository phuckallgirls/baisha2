const express = require('express');
const router = express.Router();
const Wechat = require('../controller/Wechat');

// 微信小程序登录
router.post('/login', Wechat.login);

module.exports = router; 