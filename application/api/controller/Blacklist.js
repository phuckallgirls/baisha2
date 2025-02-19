const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class BlacklistController {
    // 加入/移出黑名单
    static async toggle(req, res) {
        try {
            const user_id = req.user.id;
            const { block_id } = req.body;

            if (!block_id) {
                return res.json(Response.error('参数错误'));
            }

            if (user_id === parseInt(block_id)) {
                return res.json(Response.error('不能拉黑自己'));
            }

            // 检查目标用户是否存在
            const [users] = await db.execute(
                'SELECT id FROM t_user WHERE id = ? AND status = "normal"',
                [block_id]
            );

            if (!users.length) {
                return res.json(Response.error('用户不存在'));
            }

            // 检查是否已拉黑
            const [blocks] = await db.execute(
                'SELECT id FROM t_blacklist WHERE user_id = ? AND block_id = ?',
                [user_id, block_id]
            );

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                if (blocks.length) {
                    // 移出黑名单
                    await connection.execute(
                        'DELETE FROM t_blacklist WHERE user_id = ? AND block_id = ?',
                        [user_id, block_id]
                    );
                } else {
                    // 加入黑名单，同时取消互相关注
                    await connection.execute(
                        'INSERT INTO t_blacklist (user_id, block_id, createtime) VALUES (?, ?, ?)',
                        [user_id, block_id, Math.floor(Date.now() / 1000)]
                    );

                    // 检查并取消关注关系
                    const [follows] = await connection.execute(
                        'SELECT id FROM t_follow WHERE (user_id = ? AND follow_id = ?) OR (user_id = ? AND follow_id = ?)',
                        [user_id, block_id, block_id, user_id]
                    );

                    if (follows.length) {
                        // 删除关注关系
                        await connection.execute(
                            'DELETE FROM t_follow WHERE (user_id = ? AND follow_id = ?) OR (user_id = ? AND follow_id = ?)',
                            [user_id, block_id, block_id, user_id]
                        );

                        // 更新双方的关注数和粉丝数
                        await connection.execute(
                            'UPDATE t_user SET follow_num = GREATEST(follow_num - 1, 0), fans_num = GREATEST(fans_num - 1, 0) WHERE id IN (?, ?)',
                            [user_id, block_id]
                        );
                    }
                }

                await connection.commit();
                return res.json(Response.success(null, blocks.length ? '移出黑名单成功' : '加入黑名单成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Toggle blacklist error:', err);
            return res.json(Response.error('操作失败'));
        }
    }

    // 获取黑名单列表
    static async list(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_blacklist WHERE user_id = ?',
                [user_id]
            );

            // 获取列表
            const [blacklist] = await db.execute(
                `SELECT b.*, u.nickname, u.avatar, u.bio
                FROM t_blacklist b
                LEFT JOIN t_user u ON b.block_id = u.id
                WHERE b.user_id = ? AND u.status = "normal"
                ORDER BY b.createtime DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: blacklist
            }));
        } catch (err) {
            console.error('Get blacklist error:', err);
            return res.json(Response.error('获取黑名单列表失败'));
        }
    }

    // 检查是否在黑名单中
    static async check(req, res) {
        try {
            const user_id = req.user.id;
            const { block_id } = req.query;

            if (!block_id) {
                return res.json(Response.error('参数错误'));
            }

            const [blocks] = await db.execute(
                'SELECT id FROM t_blacklist WHERE user_id = ? AND block_id = ?',
                [user_id, block_id]
            );

            return res.json(Response.success({
                is_blocked: blocks.length > 0
            }));
        } catch (err) {
            console.error('Check blacklist error:', err);
            return res.json(Response.error('检查黑名单状态失败'));
        }
    }

    // 检查是否被拉黑
    static async checkBlocked(req, res) {
        try {
            const user_id = req.user.id;
            const { check_id } = req.query;

            if (!check_id) {
                return res.json(Response.error('参数错误'));
            }

            const [blocks] = await db.execute(
                'SELECT id FROM t_blacklist WHERE user_id = ? AND block_id = ?',
                [check_id, user_id]
            );

            return res.json(Response.success({
                is_blocked_by: blocks.length > 0
            }));
        } catch (err) {
            console.error('Check blocked error:', err);
            return res.json(Response.error('检查被拉黑状态失败'));
        }
    }
}

module.exports = BlacklistController; 