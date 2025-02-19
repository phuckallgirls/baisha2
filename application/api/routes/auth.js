const express = require('express');
const router = express.Router();
const Auth = require('../controller/Auth');

// 登录
router.post('/login', Auth.login);

// 注册
router.post('/register', Auth.register);

module.exports = router; 