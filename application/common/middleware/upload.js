const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadConfig = require('../config/upload');

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const type = req.query.type || 'image';
        const targetDir = path.join(uploadDir, type);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = Date.now() + '_' + Math.random().toString(36).substr(2) + ext;
        cb(null, filename);
    }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
    const type = req.query.type || 'image';
    const config = uploadConfig[type];

    if (!config) {
        return cb(new Error('不支持的文件类型'));
    }

    if (!config.mimes.includes(file.mimetype)) {
        return cb(new Error(`只允许上传 ${config.extensions.join(',')} 格式的文件`));
    }

    cb(null, true);
};

// 创建上传中间件
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: (req) => {
            const type = req.query.type || 'image';
            return uploadConfig[type].maxSize;
        }
    }
});

module.exports = upload; 