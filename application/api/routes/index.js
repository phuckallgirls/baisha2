const express = require('express');
const router = express.Router();
const Index = require('../controller/Index');

// 首页初始化数据
router.get('/init', Index.init);

// 获取分类列表
router.get('/categories', Index.categories);

// 获取轮播图列表
router.get('/banners', Index.banners);

module.exports = router; 