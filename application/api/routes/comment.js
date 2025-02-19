const express = require('express');
const router = express.Router();
const Comment = require('../controller/Comment');
const auth = require('../../common/middleware/auth');

// 发表评论（需要登录）
router.post('/create', auth, Comment.create);

// 获取评论列表（不需要登录）
router.get('/list', Comment.list);

// 删除评论（需要登录）
router.delete('/delete/:id', auth, Comment.delete);

module.exports = router; 