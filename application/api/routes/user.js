const express = require('express');
const router = express.Router();
const User = require('../controller/User');
const auth = require('../../common/middleware/auth');

// 获取用户信息（需要登录）
router.get('/profile', auth, User.profile);

// 更新用户信息（需要登录）
router.post('/update', auth, User.update);

// 修改密码（需要登录）
router.post('/changepwd', auth, User.changePwd);

// 重置密码（不需要登录）
router.post('/resetpwd', User.resetPwd);

// 发送验证码（不需要登录）
router.post('/sendcode', User.sendCode);

// 获取我的发布（需要登录）
router.get('/posts', auth, User.posts);

// 获取我的收藏（需要登录）
router.get('/collects', auth, User.collects);

module.exports = router; 