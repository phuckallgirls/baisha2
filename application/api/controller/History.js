const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class HistoryController {
    // 记录浏览历史
    static async record(req, res) {
        try {
            const user_id = req.user.id;
            const { post_id } = req.body;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            // 检查帖子是否存在
            const [posts] = await db.execute(
                'SELECT id FROM t_post WHERE id = ? AND status = "normal"',
                [post_id]
            );

            if (!posts.length) {
                return res.json(Response.error('帖子不存在'));
            }

            // 使用 REPLACE INTO 避免重复记录
            await db.execute(
                `REPLACE INTO t_view_history (user_id, post_id, createtime)
                VALUES (?, ?, ?)`,
                [user_id, post_id, Math.floor(Date.now() / 1000)]
            );

            return res.json(Response.success());
        } catch (err) {
            console.error('Record view history error:', err);
            return res.json(Response.error('记录浏览历史失败'));
        }
    }

    // 获取浏览历史列表
    static async list(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_view_history WHERE user_id = ?',
                [user_id]
            );

            // 获取列表
            const [histories] = await db.execute(
                `SELECT h.*, p.title, p.cover, p.view_num, p.like_num, p.comment_num, 
                        p.createtime as post_createtime, u.nickname, u.avatar
                FROM t_view_history h
                LEFT JOIN t_post p ON h.post_id = p.id
                LEFT JOIN t_user u ON p.user_id = u.id
                WHERE h.user_id = ? AND p.status = "normal"
                ORDER BY h.createtime DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: histories
            }));
        } catch (err) {
            console.error('Get view history error:', err);
            return res.json(Response.error('获取浏览历史失败'));
        }
    }

    // 清除浏览历史
    static async clear(req, res) {
        try {
            const user_id = req.user.id;

            await db.execute(
                'DELETE FROM t_view_history WHERE user_id = ?',
                [user_id]
            );

            return res.json(Response.success(null, '清除成功'));
        } catch (err) {
            console.error('Clear view history error:', err);
            return res.json(Response.error('清除浏览历史失败'));
        }
    }
}

module.exports = HistoryController; 