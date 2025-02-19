const express = require('express');
const router = express.Router();
const Recommend = require('../controller/Recommend');
const auth = require('../../common/middleware/auth');
const admin = require('../../common/middleware/admin');

// 设置/取消推荐（需要管理员权限）
router.post('/toggle', [auth, admin], Recommend.toggle);

// 获取推荐列表
router.get('/list', Recommend.list);

// 检查是否推荐
router.get('/check', Recommend.check);

module.exports = router; 