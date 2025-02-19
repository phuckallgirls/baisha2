const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class StickController {
    // 设置/取消置顶
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

            // 检查是否已置顶
            const [sticks] = await db.execute(
                'SELECT id FROM t_stick WHERE post_id = ?',
                [post_id]
            );

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                if (sticks.length) {
                    // 取消置顶
                    await connection.execute(
                        'DELETE FROM t_stick WHERE post_id = ?',
                        [post_id]
                    );
                    await connection.execute(
                        'UPDATE t_post SET is_stick = 0 WHERE id = ?',
                        [post_id]
                    );
                } else {
                    // 设置置顶
                    const now = Math.floor(Date.now() / 1000);
                    await connection.execute(
                        `INSERT INTO t_stick 
                        (post_id, admin_id, stick_time, end_time, createtime) 
                        VALUES (?, ?, ?, ?, ?)`,
                        [post_id, admin_id, now, end_time, now]
                    );
                    await connection.execute(
                        'UPDATE t_post SET is_stick = 1 WHERE id = ?',
                        [post_id]
                    );
                }

                await connection.commit();
                return res.json(Response.success(null, sticks.length ? '取消置顶成功' : '设置置顶成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Toggle stick error:', err);
            return res.json(Response.error('操作失败'));
        }
    }

    // 获取置顶列表
    static async list(req, res) {
        try {
            const { page = 1, page_size = 10 } = req.query;
            const now = Math.floor(Date.now() / 1000);

            // 获取总数
            const [countResult] = await db.execute(
                `SELECT COUNT(*) as total FROM t_stick 
                WHERE end_time IS NULL OR end_time > ?`,
                [now]
            );

            // 获取列表
            const [sticks] = await db.execute(
                `SELECT s.*, p.title, p.content, p.cover, p.view_num, 
                        p.like_num, p.comment_num, u.nickname as admin_name
                FROM t_stick s
                LEFT JOIN t_post p ON s.post_id = p.id
                LEFT JOIN t_user u ON s.admin_id = u.id
                WHERE s.end_time IS NULL OR s.end_time > ?
                ORDER BY s.stick_time DESC
                LIMIT ? OFFSET ?`,
                [now, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: sticks
            }));
        } catch (err) {
            console.error('Get stick list error:', err);
            return res.json(Response.error('获取置顶列表失败'));
        }
    }

    // 检查是否置顶
    static async check(req, res) {
        try {
            const { post_id } = req.query;
            const now = Math.floor(Date.now() / 1000);

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            const [sticks] = await db.execute(
                `SELECT id FROM t_stick 
                WHERE post_id = ? AND (end_time IS NULL OR end_time > ?)`,
                [post_id, now]
            );

            return res.json(Response.success({
                is_stick: sticks.length > 0
            }));
        } catch (err) {
            console.error('Check stick error:', err);
            return res.json(Response.error('检查置顶状态失败'));
        }
    }
}

module.exports = StickController; 