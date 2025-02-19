const express = require('express');
const router = express.Router();
const Stick = require('../controller/Stick');
const auth = require('../../common/middleware/auth');
const admin = require('../../common/middleware/admin');

// 设置/取消置顶（需要管理员权限）
router.post('/toggle', [auth, admin], Stick.toggle);

// 获取置顶列表
router.get('/list', Stick.list);

// 检查是否置顶
router.get('/check', Stick.check);

module.exports = router; 