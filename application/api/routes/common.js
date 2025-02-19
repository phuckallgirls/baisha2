const express = require('express');
const router = express.Router();
const Common = require('../controller/Common');
const upload = require('../../common/middleware/upload');
const auth = require('../../common/middleware/auth');

// 文件上传（需要登录）
router.post('/upload', auth, upload.single('file'), Common.upload);

// 获取配置（不需要登录）
router.get('/config', Common.config);

module.exports = router; 