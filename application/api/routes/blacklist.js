const express = require('express');
const router = express.Router();
const Blacklist = require('../controller/Blacklist');
const auth = require('../../common/middleware/auth');

// 加入/移出黑名单
router.post('/toggle', auth, Blacklist.toggle);

// 获取黑名单列表
router.get('/list', auth, Blacklist.list);

// 检查是否在黑名单中
router.get('/check', auth, Blacklist.check);

// 检查是否被拉黑
router.get('/check_blocked', auth, Blacklist.checkBlocked);

module.exports = router; 