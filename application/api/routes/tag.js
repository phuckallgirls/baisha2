const express = require('express');
const router = express.Router();
const Tag = require('../controller/Tag');
const auth = require('../../common/middleware/auth');
const admin = require('../../common/middleware/admin');

// 创建标签（需要管理员权限）
router.post('/', [auth, admin], Tag.create);

// 删除标签（需要管理员权限）
router.delete('/:id', [auth, admin], Tag.delete);

// 获取标签列表
router.get('/list', Tag.list);

// 获取热门标签
router.get('/hot', Tag.hot);

// 获取帖子的标签
router.get('/post', Tag.getByPost);

// 更新帖子标签（需要认证）
router.post('/post', auth, Tag.updatePostTags);

module.exports = router; 