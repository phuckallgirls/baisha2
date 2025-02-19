const express = require('express');
const router = express.Router();
const Audit = require('../controller/Audit');
const auth = require('../../common/middleware/auth');
const admin = require('../../common/middleware/admin');

// 提交审核
router.post('/submit', auth, Audit.submit);

// 审核操作（需要管理员权限）
router.post('/review', [auth, admin], Audit.review);

// 获取审核列表（需要管理员权限）
router.get('/list', [auth, admin], Audit.list);

// 获取审核详情
router.get('/detail', auth, Audit.detail);

module.exports = router; 