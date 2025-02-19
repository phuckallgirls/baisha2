const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class TagController {
    // 创建标签
    static async create(req, res) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.json(Response.error('请输入标签名称'));
            }

            // 检查标签是否已存在
            const [tags] = await db.execute(
                'SELECT id FROM t_tag WHERE name = ?',
                [name]
            );

            if (tags.length) {
                return res.json(Response.error('标签已存在'));
            }

            const now = Math.floor(Date.now() / 1000);
            await db.execute(
                'INSERT INTO t_tag (name, createtime) VALUES (?, ?)',
                [name, now]
            );

            return res.json(Response.success(null, '创建成功'));
        } catch (err) {
            console.error('Create tag error:', err);
            return res.json(Response.error('创建标签失败'));
        }
    }

    // 删除标签
    static async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.json(Response.error('参数错误'));
            }

            // 检查标签是否存在
            const [tags] = await db.execute(
                'SELECT id FROM t_tag WHERE id = ?',
                [id]
            );

            if (!tags.length) {
                return res.json(Response.error('标签不存在'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 删除标签关联
                await connection.execute(
                    'DELETE FROM t_post_tag WHERE tag_id = ?',
                    [id]
                );

                // 删除标签
                await connection.execute(
                    'DELETE FROM t_tag WHERE id = ?',
                    [id]
                );

                await connection.commit();
                return res.json(Response.success(null, '删除成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Delete tag error:', err);
            return res.json(Response.error('删除标签失败'));
        }
    }

    // 获取标签列表
    static async list(req, res) {
        try {
            const { page = 1, page_size = 10, sort_by = 'post_count' } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_tag'
            );

            // 获取列表
            const orderBy = sort_by === 'post_count' ? 'post_count DESC' : 'createtime DESC';
            const [tags] = await db.execute(
                `SELECT * FROM t_tag 
                ORDER BY ${orderBy}
                LIMIT ? OFFSET ?`,
                [parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: tags
            }));
        } catch (err) {
            console.error('Get tag list error:', err);
            return res.json(Response.error('获取标签列表失败'));
        }
    }

    // 获取热门标签
    static async hot(req, res) {
        try {
            const { limit = 10 } = req.query;

            const [tags] = await db.execute(
                `SELECT * FROM t_tag 
                WHERE post_count > 0
                ORDER BY post_count DESC 
                LIMIT ?`,
                [parseInt(limit)]
            );

            return res.json(Response.success(tags));
        } catch (err) {
            console.error('Get hot tags error:', err);
            return res.json(Response.error('获取热门标签失败'));
        }
    }

    // 根据帖子ID获取标签
    static async getByPost(req, res) {
        try {
            const { post_id } = req.query;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            const [tags] = await db.execute(
                `SELECT t.* FROM t_tag t
                INNER JOIN t_post_tag pt ON t.id = pt.tag_id
                WHERE pt.post_id = ?`,
                [post_id]
            );

            return res.json(Response.success(tags));
        } catch (err) {
            console.error('Get post tags error:', err);
            return res.json(Response.error('获取帖子标签失败'));
        }
    }

    // 更新帖子标签
    static async updatePostTags(req, res) {
        try {
            const { post_id, tag_ids } = req.body;

            if (!post_id || !Array.isArray(tag_ids)) {
                return res.json(Response.error('参数错误'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 删除旧的标签关联
                await connection.execute(
                    'DELETE FROM t_post_tag WHERE post_id = ?',
                    [post_id]
                );

                // 添加新的标签关联
                if (tag_ids.length > 0) {
                    const values = tag_ids.map(tag_id => [post_id, tag_id]);
                    await connection.query(
                        'INSERT INTO t_post_tag (post_id, tag_id) VALUES ?',
                        [values]
                    );
                }

                // 更新标签的帖子数量
                await connection.execute(
                    `UPDATE t_tag t 
                    SET post_count = (
                        SELECT COUNT(*) 
                        FROM t_post_tag pt 
                        WHERE pt.tag_id = t.id
                    )`
                );

                await connection.commit();
                return res.json(Response.success(null, '更新成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Update post tags error:', err);
            return res.json(Response.error('更新帖子标签失败'));
        }
    }
}

module.exports = TagController; 