const express = require('express');
const router = express.Router();
const History = require('../controller/History');
const auth = require('../../common/middleware/auth');

// 记录浏览历史
router.post('/record', auth, History.record);

// 获取浏览历史列表
router.get('/list', auth, History.list);

// 清除浏览历史
router.post('/clear', auth, History.clear);

module.exports = router; 