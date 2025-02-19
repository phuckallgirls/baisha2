const express = require('express');
const router = express.Router();
const Search = require('../controller/Search');
const auth = require('../../common/middleware/auth');

// 保存搜索历史（需要登录）
router.post('/save_log', auth, Search.saveLog);

// 获取搜索历史（需要登录）
router.get('/history', auth, Search.getHistory);

// 清除搜索历史（需要登录）
router.post('/clear_history', auth, Search.clearHistory);

module.exports = router; 