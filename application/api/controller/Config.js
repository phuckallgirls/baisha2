const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class ConfigController {
    // 获取配置列表
    static async list(req, res) {
        try {
            const { group = null } = req.query;

            let sql = 'SELECT * FROM t_config';
            const params = [];

            if (group) {
                sql += ' WHERE `group` = ?';
                params.push(group);
            }

            sql += ' ORDER BY sort DESC, id ASC';

            const [configs] = await db.execute(sql, params);

            // 按组分类
            const groupedConfigs = configs.reduce((acc, config) => {
                if (!acc[config.group]) {
                    acc[config.group] = [];
                }
                acc[config.group].push(config);
                return acc;
            }, {});

            return res.json(Response.success(groupedConfigs));
        } catch (err) {
            console.error('Get config list error:', err);
            return res.json(Response.error('获取配置列表失败'));
        }
    }

    // 获取配置项
    static async get(req, res) {
        try {
            const { name } = req.params;

            if (!name) {
                return res.json(Response.error('参数错误'));
            }

            const [configs] = await db.execute(
                'SELECT * FROM t_config WHERE name = ?',
                [name]
            );

            if (!configs.length) {
                return res.json(Response.error('配置项不存在'));
            }

            return res.json(Response.success(configs[0]));
        } catch (err) {
            console.error('Get config error:', err);
            return res.json(Response.error('获取配置项失败'));
        }
    }

    // 更新配置
    static async update(req, res) {
        try {
            const { configs } = req.body;

            if (!Array.isArray(configs)) {
                return res.json(Response.error('参数错误'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                const now = Math.floor(Date.now() / 1000);

                for (const config of configs) {
                    const { name, value } = config;
                    if (!name) continue;

                    await connection.execute(
                        'UPDATE t_config SET value = ?, updatetime = ? WHERE name = ?',
                        [value, now, name]
                    );
                }

                await connection.commit();
                return res.json(Response.success(null, '更新成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Update config error:', err);
            return res.json(Response.error('更新配置失败'));
        }
    }

    // 创建配置项
    static async create(req, res) {
        try {
            const { name, group, title, tip, type, value, sort = 0 } = req.body;

            if (!name || !group || !title || !type) {
                return res.json(Response.error('请填写必要信息'));
            }

            // 检查配置名是否已存在
            const [configs] = await db.execute(
                'SELECT id FROM t_config WHERE name = ?',
                [name]
            );

            if (configs.length) {
                return res.json(Response.error('配置名已存在'));
            }

            const now = Math.floor(Date.now() / 1000);
            await db.execute(
                `INSERT INTO t_config 
                (name, \`group\`, title, tip, type, value, sort, createtime, updatetime) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, group, title, tip, type, value, sort, now, now]
            );

            return res.json(Response.success(null, '创建成功'));
        } catch (err) {
            console.error('Create config error:', err);
            return res.json(Response.error('创建配置项失败'));
        }
    }

    // 删除配置项
    static async delete(req, res) {
        try {
            const { name } = req.params;

            if (!name) {
                return res.json(Response.error('参数错误'));
            }

            await db.execute('DELETE FROM t_config WHERE name = ?', [name]);

            return res.json(Response.success(null, '删除成功'));
        } catch (err) {
            console.error('Delete config error:', err);
            return res.json(Response.error('删除配置项失败'));
        }
    }
}

module.exports = ConfigController; 