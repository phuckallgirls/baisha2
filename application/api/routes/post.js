const express = require('express');
const router = express.Router();
const Post = require('../controller/Post');
const auth = require('../../common/middleware/auth');

// 发布信息（需要登录）
router.post('/create', auth, Post.create);

// 获取信息详情（不需要登录，但如果登录了会返回额外的用户相关状态）
router.get('/detail/:id', async (req, res, next) => {
    try {
        // 如果有token就验证，没有也可以继续
        const token = req.headers.authorization?.split(' ')[1] || req.headers.token;
        if (token) {
            await auth(req, res, () => {});
        }
        next();
    } catch (err) {
        next();
    }
}, Post.detail);

// 获取信息列表（不需要登录，但如果登录了会返回额外的用户相关状态）
router.get('/list', async (req, res, next) => {
    try {
        // 如果有token就验证，没有也可以继续
        const token = req.headers.authorization?.split(' ')[1] || req.headers.token;
        if (token) {
            await auth(req, res, () => {});
        }
        next();
    } catch (err) {
        next();
    }
}, Post.list);

// 删除信息（需要登录）
router.delete('/delete/:id', auth, Post.delete);

// 点赞/取消点赞（需要登录）
router.post('/like/:id', auth, Post.like);

// 收藏/取消收藏（需要登录）
router.post('/collect/:id', auth, Post.collect);

module.exports = router; 