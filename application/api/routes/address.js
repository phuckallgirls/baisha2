const express = require('express');
const router = express.Router();
const Address = require('../controller/Address');
const auth = require('../../common/middleware/auth');

// 获取地址列表
router.get('/list', auth, Address.list);

// 添加地址
router.post('/create', auth, Address.create);

// 更新地址
router.put('/:id', auth, Address.update);

// 删除地址
router.delete('/:id', auth, Address.delete);

module.exports = router; 