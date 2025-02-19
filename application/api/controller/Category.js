const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class CategoryController {
    // 创建分类
    static async create(req, res) {
        try {
            const { name, description = null, sort = 0 } = req.body;

            if (!name) {
                return res.json(Response.error('请输入分类名称'));
            }

            // 检查分类名是否已存在
            const [categories] = await db.execute(
                'SELECT id FROM t_category WHERE name = ?',
                [name]
            );

            if (categories.length) {
                return res.json(Response.error('分类名称已存在'));
            }

            const now = Math.floor(Date.now() / 1000);
            await db.execute(
                `INSERT INTO t_category 
                (name, description, sort, createtime, updatetime) 
                VALUES (?, ?, ?, ?, ?)`,
                [name, description, sort, now, now]
            );

            return res.json(Response.success(null, '创建成功'));
        } catch (err) {
            console.error('Create category error:', err);
            return res.json(Response.error('创建分类失败'));
        }
    }

    // 更新分类
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, sort, status } = req.body;

            if (!id) {
                return res.json(Response.error('参数错误'));
            }

            // 检查分类是否存在
            const [categories] = await db.execute(
                'SELECT id FROM t_category WHERE id = ?',
                [id]
            );

            if (!categories.length) {
                return res.json(Response.error('分类不存在'));
            }

            // 如果修改了名称，检查是否与其他分类重名
            if (name) {
                const [exists] = await db.execute(
                    'SELECT id FROM t_category WHERE name = ? AND id != ?',
                    [name, id]
                );

                if (exists.length) {
                    return res.json(Response.error('分类名称已存在'));
                }
            }

            const updates = [];
            const values = [];
            const now = Math.floor(Date.now() / 1000);

            if (name) {
                updates.push('name = ?');
                values.push(name);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                values.push(description);
            }
            if (sort !== undefined) {
                updates.push('sort = ?');
                values.push(sort);
            }
            if (status) {
                updates.push('status = ?');
                values.push(status);
            }
            updates.push('updatetime = ?');
            values.push(now);

            values.push(id);

            await db.execute(
                `UPDATE t_category SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            return res.json(Response.success(null, '更新成功'));
        } catch (err) {
            console.error('Update category error:', err);
            return res.json(Response.error('更新分类失败'));
        }
    }

    // 删除分类
    static async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.json(Response.error('参数错误'));
            }

            // 检查分类是否存在
            const [categories] = await db.execute(
                'SELECT id FROM t_category WHERE id = ?',
                [id]
            );

            if (!categories.length) {
                return res.json(Response.error('分类不存在'));
            }

            // 检查分类下是否有帖子
            const [posts] = await db.execute(
                'SELECT COUNT(*) as count FROM t_post WHERE category_id = ?',
                [id]
            );

            if (posts[0].count > 0) {
                return res.json(Response.error('该分类下还有帖子，无法删除'));
            }

            await db.execute('DELETE FROM t_category WHERE id = ?', [id]);

            return res.json(Response.success(null, '删除成功'));
        } catch (err) {
            console.error('Delete category error:', err);
            return res.json(Response.error('删除分类失败'));
        }
    }

    // 获取分类列表
    static async list(req, res) {
        try {
            const { status = 'normal' } = req.query;

            const [categories] = await db.execute(
                `SELECT * FROM t_category 
                WHERE status = ? 
                ORDER BY sort DESC, id ASC`,
                [status]
            );

            return res.json(Response.success(categories));
        } catch (err) {
            console.error('Get category list error:', err);
            return res.json(Response.error('获取分类列表失败'));
        }
    }

    // 获取分类详情
    static async detail(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.json(Response.error('参数错误'));
            }

            const [categories] = await db.execute(
                'SELECT * FROM t_category WHERE id = ?',
                [id]
            );

            if (!categories.length) {
                return res.json(Response.error('分类不存在'));
            }

            return res.json(Response.success(categories[0]));
        } catch (err) {
            console.error('Get category detail error:', err);
            return res.json(Response.error('获取分类详情失败'));
        }
    }
}

module.exports = CategoryController; 