const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class FavoriteController {
    // 收藏/取消收藏
    static async toggle(req, res) {
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

            // 检查是否已收藏
            const [favorites] = await db.execute(
                'SELECT id FROM t_favorite WHERE user_id = ? AND post_id = ?',
                [user_id, post_id]
            );

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                if (favorites.length) {
                    // 取消收藏
                    await connection.execute(
                        'DELETE FROM t_favorite WHERE user_id = ? AND post_id = ?',
                        [user_id, post_id]
                    );
                    await connection.execute(
                        'UPDATE t_post SET favorite_num = favorite_num - 1 WHERE id = ?',
                        [post_id]
                    );
                } else {
                    // 添加收藏
                    await connection.execute(
                        'INSERT INTO t_favorite (user_id, post_id, createtime) VALUES (?, ?, ?)',
                        [user_id, post_id, Math.floor(Date.now() / 1000)]
                    );
                    await connection.execute(
                        'UPDATE t_post SET favorite_num = favorite_num + 1 WHERE id = ?',
                        [post_id]
                    );
                }

                await connection.commit();
                return res.json(Response.success(null, favorites.length ? '取消收藏成功' : '收藏成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Toggle favorite error:', err);
            return res.json(Response.error('操作失败'));
        }
    }

    // 获取收藏列表
    static async list(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_favorite WHERE user_id = ?',
                [user_id]
            );

            // 获取列表
            const [favorites] = await db.execute(
                `SELECT f.*, p.title, p.cover, p.view_num, p.like_num, p.comment_num, 
                        p.createtime as post_createtime, u.nickname, u.avatar
                FROM t_favorite f
                LEFT JOIN t_post p ON f.post_id = p.id
                LEFT JOIN t_user u ON p.user_id = u.id
                WHERE f.user_id = ? AND p.status = "normal"
                ORDER BY f.createtime DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: favorites
            }));
        } catch (err) {
            console.error('Get favorite list error:', err);
            return res.json(Response.error('获取收藏列表失败'));
        }
    }

    // 检查是否已收藏
    static async check(req, res) {
        try {
            const user_id = req.user.id;
            const { post_id } = req.query;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            const [favorites] = await db.execute(
                'SELECT id FROM t_favorite WHERE user_id = ? AND post_id = ?',
                [user_id, post_id]
            );

            return res.json(Response.success({
                is_favorite: favorites.length > 0
            }));
        } catch (err) {
            console.error('Check favorite error:', err);
            return res.json(Response.error('检查收藏状态失败'));
        }
    }
}

module.exports = FavoriteController; 