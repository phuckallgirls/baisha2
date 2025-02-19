const express = require('express');
const router = express.Router();
const Share = require('../controller/Share');
const auth = require('../../common/middleware/auth');
const optionalAuth = require('../../common/middleware/optionalAuth');

// 生成分享链接（可选登录）
router.get('/link', optionalAuth, Share.getLink);

// 记录分享（可选登录）
router.post('/record', optionalAuth, Share.record);

// 获取分享统计
router.get('/stats', Share.stats);

module.exports = router; 