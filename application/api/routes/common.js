const express = require('express');
const router = express.Router();
const Common = require('../controller/Common');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 获取社区列表 v2
router.get('/get_community_v2', Common.getCommunityV2);

// 获取配置
router.get('/config', Common.getConfig);

// 获取所有配置
router.get('/config/all', Common.getAllConfig);

// 上传文件
router.post('/upload', upload.single('file'), Common.upload);

// 获取地区列表
router.get('/area', Common.getArea);

// 获取版本信息
router.get('/version', Common.getVersion);

module.exports = router; 