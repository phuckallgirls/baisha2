const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class FollowController {
    // 关注/取消关注
    static async toggle(req, res) {
        try {
            const user_id = req.user.id;
            const { follow_id } = req.body;

            if (!follow_id) {
                return res.json(Response.error('参数错误'));
            }

            if (user_id === parseInt(follow_id)) {
                return res.json(Response.error('不能关注自己'));
            }

            // 检查目标用户是否存在
            const [users] = await db.execute(
                'SELECT id FROM t_user WHERE id = ? AND status = "normal"',
                [follow_id]
            );

            if (!users.length) {
                return res.json(Response.error('用户不存在'));
            }

            // 检查是否已关注
            const [follows] = await db.execute(
                'SELECT id FROM t_follow WHERE user_id = ? AND follow_id = ?',
                [user_id, follow_id]
            );

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                if (follows.length) {
                    // 取消关注
                    await connection.execute(
                        'DELETE FROM t_follow WHERE user_id = ? AND follow_id = ?',
                        [user_id, follow_id]
                    );
                    // 更新关注数和粉丝数
                    await connection.execute(
                        'UPDATE t_user SET follow_num = follow_num - 1 WHERE id = ?',
                        [user_id]
                    );
                    await connection.execute(
                        'UPDATE t_user SET fans_num = fans_num - 1 WHERE id = ?',
                        [follow_id]
                    );
                } else {
                    // 添加关注
                    await connection.execute(
                        'INSERT INTO t_follow (user_id, follow_id, createtime) VALUES (?, ?, ?)',
                        [user_id, follow_id, Math.floor(Date.now() / 1000)]
                    );
                    // 更新关注数和粉丝数
                    await connection.execute(
                        'UPDATE t_user SET follow_num = follow_num + 1 WHERE id = ?',
                        [user_id]
                    );
                    await connection.execute(
                        'UPDATE t_user SET fans_num = fans_num + 1 WHERE id = ?',
                        [follow_id]
                    );
                }

                await connection.commit();
                return res.json(Response.success(null, follows.length ? '取消关注成功' : '关注成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Toggle follow error:', err);
            return res.json(Response.error('操作失败'));
        }
    }

    // 获取关注列表
    static async followList(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_follow WHERE user_id = ?',
                [user_id]
            );

            // 获取列表
            const [follows] = await db.execute(
                `SELECT f.*, u.nickname, u.avatar, u.bio
                FROM t_follow f
                LEFT JOIN t_user u ON f.follow_id = u.id
                WHERE f.user_id = ? AND u.status = "normal"
                ORDER BY f.createtime DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: follows
            }));
        } catch (err) {
            console.error('Get follow list error:', err);
            return res.json(Response.error('获取关注列表失败'));
        }
    }

    // 获取粉丝列表
    static async fansList(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_follow WHERE follow_id = ?',
                [user_id]
            );

            // 获取列表
            const [fans] = await db.execute(
                `SELECT f.*, u.nickname, u.avatar, u.bio
                FROM t_follow f
                LEFT JOIN t_user u ON f.user_id = u.id
                WHERE f.follow_id = ? AND u.status = "normal"
                ORDER BY f.createtime DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: fans
            }));
        } catch (err) {
            console.error('Get fans list error:', err);
            return res.json(Response.error('获取粉丝列表失败'));
        }
    }

    // 检查是否已关注
    static async check(req, res) {
        try {
            const user_id = req.user.id;
            const { follow_id } = req.query;

            if (!follow_id) {
                return res.json(Response.error('参数错误'));
            }

            const [follows] = await db.execute(
                'SELECT id FROM t_follow WHERE user_id = ? AND follow_id = ?',
                [user_id, follow_id]
            );

            return res.json(Response.success({
                is_follow: follows.length > 0
            }));
        } catch (err) {
            console.error('Check follow error:', err);
            return res.json(Response.error('检查关注状态失败'));
        }
    }
}

module.exports = FollowController; 