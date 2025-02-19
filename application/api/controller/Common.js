const Response = require('../../common/utils/response');
const db = require('../../../config/database');
const path = require('path');

class CommonController {
    // 文件上传
    static async upload(req, res) {
        try {
            if (!req.file) {
                return res.json(Response.error('请选择文件'));
            }

            const type = req.query.type || 'image';
            const filename = req.file.filename;
            
            // 生成访问URL（对应原项目的url生成逻辑）
            const url = `/uploads/${type}/${filename}`;
            
            return res.json(Response.success({
                url,
                size: req.file.size,
                mime_type: req.file.mimetype
            }, '上传成功'));
        } catch (err) {
            console.error('Upload error:', err);
            return res.json(Response.error(err.message || '上传失败'));
        }
    }

    // 获取配置信息
    static async config(req, res) {
        try {
            const [configs] = await db.execute(
                'SELECT name, value FROM t_config WHERE status = "normal"'
            );

            // 转换为键值对格式（对应原项目的column方法）
            const result = {};
            configs.forEach(item => {
                result[item.name] = item.value;
            });

            return res.json(Response.success(result));
        } catch (err) {
            console.error('Get config error:', err);
            return res.json(Response.error('获取配置失败'));
        }
    }
}

module.exports = CommonController; 