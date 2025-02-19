const express = require('express');
const router = express.Router();
const Category = require('../controller/Category');
const auth = require('../../common/middleware/auth');
const admin = require('../../common/middleware/admin');

// 创建分类（需要管理员权限）
router.post('/', [auth, admin], Category.create);

// 更新分类（需要管理员权限）
router.put('/:id', [auth, admin], Category.update);

// 删除分类（需要管理员权限）
router.delete('/:id', [auth, admin], Category.delete);

// 获取分类列表
router.get('/list', Category.list);

// 获取分类详情
router.get('/:id', Category.detail);

module.exports = router; 