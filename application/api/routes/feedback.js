const express = require('express');
const router = express.Router();
const Feedback = require('../controller/Feedback');
const auth = require('../../common/middleware/auth');

// 提交反馈（需要登录）
router.post('/create', auth, Feedback.create);

// 获取反馈列表（需要登录）
router.get('/list', auth, Feedback.list);

module.exports = router; 