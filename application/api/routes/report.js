const express = require('express');
const router = express.Router();
const Report = require('../controller/Report');
const auth = require('../../common/middleware/auth');

// 获取举报原因列表（不需要登录）
router.get('/reasons', Report.reasons);

// 提交举报（需要登录）
router.post('/create', auth, Report.create);

module.exports = router; 