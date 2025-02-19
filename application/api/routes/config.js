const express = require('express');
const router = express.Router();
const Config = require('../controller/Config');
const auth = require('../../common/middleware/auth');
const admin = require('../../common/middleware/admin');

// 获取配置列表（需要管理员权限）
router.get('/list', [auth, admin], Config.list);

// 获取配置项
router.get('/:name', Config.get);

// 更新配置（需要管理员权限）
router.post('/update', [auth, admin], Config.update);

// 创建配置项（需要管理员权限）
router.post('/', [auth, admin], Config.create);

// 删除配置项（需要管理员权限）
router.delete('/:name', [auth, admin], Config.delete);

module.exports = router; 