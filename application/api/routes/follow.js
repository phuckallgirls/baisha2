const express = require('express');
const router = express.Router();
const Follow = require('../controller/Follow');
const auth = require('../../common/middleware/auth');

// 关注/取消关注
router.post('/toggle', auth, Follow.toggle);

// 获取关注列表
router.get('/follow_list', auth, Follow.followList);

// 获取粉丝列表
router.get('/fans_list', auth, Follow.fansList);

// 检查是否已关注
router.get('/check', auth, Follow.check);

module.exports = router; 