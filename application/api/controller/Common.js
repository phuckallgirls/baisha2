const Response = require('../../common/utils/response');
const db = require('../../../config/database');
const fs = require('fs').promises;
const path = require('path');

class CommonController {
    // 获取社区列表 v2
    static async getCommunityV2(req, res) {
        try {
            const { lat, lng } = req.query;

            // 获取所有社区
            const [communities] = await db.execute(
                `SELECT id, name, lat, lng, 
                IF(lat IS NOT NULL AND lng IS NOT NULL,
                    ROUND(
                        6378.138 * 2 * ASIN(
                            SQRT(
                                POW(SIN((? * PI() / 180 - lat * PI() / 180) / 2), 2) +
                                COS(? * PI() / 180) * COS(lat * PI() / 180) *
                                POW(SIN((? * PI() / 180 - lng * PI() / 180) / 2), 2)
                            )
                        ) * 1000
                    ), 
                2),
                NULL) as distance
                FROM t_community 
                WHERE status = 'normal'
                ORDER BY distance IS NULL, distance ASC`,
                [lat || 0, lat || 0, lng || 0]
            );

            return res.json(Response.success({
                list: communities
            }));
        } catch (err) {
            console.error('Get community v2 error:', err);
            return res.json(Response.error('获取社区列表失败'));
        }
    }

    // 获取配置
    static async getConfig(req, res) {
        try {
            const { name } = req.query;

            if (!name) {
                return res.json(Response.error('参数错误'));
            }

            const [configs] = await db.execute(
                'SELECT value FROM t_config WHERE name = ? AND status = "normal"',
                [name]
            );

            return res.json(Response.success({
                value: configs.length ? configs[0].value : null
            }));
        } catch (err) {
            console.error('Get config error:', err);
            return res.json(Response.error('获取配置失败'));
        }
    }

    // 获取所有配置
    static async getAllConfig(req, res) {
        try {
            const [configs] = await db.execute(
                'SELECT name, value FROM t_config WHERE status = "normal"'
            );

            const configMap = {};
            configs.forEach(config => {
                configMap[config.name] = config.value;
            });

            return res.json(Response.success(configMap));
        } catch (err) {
            console.error('Get all config error:', err);
            return res.json(Response.error('获取配置失败'));
        }
    }

    // 上传文件
    static async upload(req, res) {
        try {
            if (!req.file) {
                return res.json(Response.error('请选择文件'));
            }

            const file = req.file;
            const fileUrl = `/uploads/${file.filename}`;

            return res.json(Response.success({
                url: fileUrl
            }));
        } catch (err) {
            console.error('Upload file error:', err);
            return res.json(Response.error('上传失败'));
        }
    }

    // 获取地区列表
    static async getArea(req, res) {
        try {
            const { pid = 0 } = req.query;

            const [areas] = await db.execute(
                'SELECT id, name FROM t_area WHERE pid = ? ORDER BY id ASC',
                [pid]
            );

            return res.json(Response.success({
                list: areas
            }));
        } catch (err) {
            console.error('Get area error:', err);
            return res.json(Response.error('获取地区列表失败'));
        }
    }

    // 获取版本信息
    static async getVersion(req, res) {
        try {
            const { platform } = req.query;

            if (!platform) {
                return res.json(Response.error('参数错误'));
            }

            const [versions] = await db.execute(
                'SELECT * FROM t_version WHERE platform = ? AND status = "normal" ORDER BY id DESC LIMIT 1',
                [platform]
            );

            return res.json(Response.success(
                versions.length ? versions[0] : null
            ));
        } catch (err) {
            console.error('Get version error:', err);
            return res.json(Response.error('获取版本信息失败'));
        }
    }
}

module.exports = CommonController; 