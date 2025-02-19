const express = require('express');
const router = express.Router();
const Favorite = require('../controller/Favorite');
const auth = require('../../common/middleware/auth');

// 收藏/取消收藏
router.post('/toggle', auth, Favorite.toggle);

// 获取收藏列表
router.get('/list', auth, Favorite.list);

// 检查是否已收藏
router.get('/check', auth, Favorite.check);

module.exports = router; 