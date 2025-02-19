const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class RecommendController {
    // 设置/取消推荐
    static async toggle(req, res) {
        try {
            const admin_id = req.user.id;
            const { post_id, end_time = null } = req.body;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            // 检查帖子是否存在
            const [posts] = await db.execute(
                'SELECT id, status FROM t_post WHERE id = ?',
                [post_id]
            );

            if (!posts.length) {
                return res.json(Response.error('帖子不存在'));
            }

            // 检查是否已推荐
            const [recommends] = await db.execute(
                'SELECT id FROM t_recommend WHERE post_id = ?',
                [post_id]
            );

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                if (recommends.length) {
                    // 取消推荐
                    await connection.execute(
                        'DELETE FROM t_recommend WHERE post_id = ?',
                        [post_id]
                    );
                    await connection.execute(
                        'UPDATE t_post SET is_recommend = 0 WHERE id = ?',
                        [post_id]
                    );
                } else {
                    // 设置推荐
                    const now = Math.floor(Date.now() / 1000);
                    await connection.execute(
                        `INSERT INTO t_recommend 
                        (post_id, admin_id, recommend_time, end_time, createtime) 
                        VALUES (?, ?, ?, ?, ?)`,
                        [post_id, admin_id, now, end_time, now]
                    );
                    await connection.execute(
                        'UPDATE t_post SET is_recommend = 1 WHERE id = ?',
                        [post_id]
                    );
                }

                await connection.commit();
                return res.json(Response.success(null, recommends.length ? '取消推荐成功' : '设置推荐成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Toggle recommend error:', err);
            return res.json(Response.error('操作失败'));
        }
    }

    // 获取推荐列表
    static async list(req, res) {
        try {
            const { page = 1, page_size = 10 } = req.query;
            const now = Math.floor(Date.now() / 1000);

            // 获取总数
            const [countResult] = await db.execute(
                `SELECT COUNT(*) as total FROM t_recommend 
                WHERE end_time IS NULL OR end_time > ?`,
                [now]
            );

            // 获取列表
            const [recommends] = await db.execute(
                `SELECT r.*, p.title, p.content, p.cover, p.view_num, 
                        p.like_num, p.comment_num, u.nickname as admin_name
                FROM t_recommend r
                LEFT JOIN t_post p ON r.post_id = p.id
                LEFT JOIN t_user u ON r.admin_id = u.id
                WHERE r.end_time IS NULL OR r.end_time > ?
                ORDER BY r.recommend_time DESC
                LIMIT ? OFFSET ?`,
                [now, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: recommends
            }));
        } catch (err) {
            console.error('Get recommend list error:', err);
            return res.json(Response.error('获取推荐列表失败'));
        }
    }

    // 检查是否推荐
    static async check(req, res) {
        try {
            const { post_id } = req.query;
            const now = Math.floor(Date.now() / 1000);

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            const [recommends] = await db.execute(
                `SELECT id FROM t_recommend 
                WHERE post_id = ? AND (end_time IS NULL OR end_time > ?)`,
                [post_id, now]
            );

            return res.json(Response.success({
                is_recommend: recommends.length > 0
            }));
        } catch (err) {
            console.error('Check recommend error:', err);
            return res.json(Response.error('检查推荐状态失败'));
        }
    }
}

module.exports = RecommendController; 