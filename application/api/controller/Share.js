const Response = require('../../common/utils/response');
const db = require('../../../config/database');
const jwt = require('jsonwebtoken');

class ShareController {
    // 生成分享链接
    static async getLink(req, res) {
        try {
            const { post_id } = req.query;
            const user_id = req.user?.id; // 用户可能未登录

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

            // 生成分享token
            const shareToken = jwt.sign(
                { 
                    post_id,
                    user_id,
                    type: 'share'
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // 生成分享链接
            const shareLink = `${process.env.APP_URL}/share/${shareToken}`;

            return res.json(Response.success({ link: shareLink }));
        } catch (err) {
            console.error('Generate share link error:', err);
            return res.json(Response.error('生成分享链接失败'));
        }
    }

    // 记录分享
    static async record(req, res) {
        try {
            const user_id = req.user?.id; // 用户可能未登录
            const { post_id, platform } = req.body;
            const ip = req.ip;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 记录分享日志
                await connection.execute(
                    `INSERT INTO t_share_log 
                    (user_id, post_id, platform, ip, createtime)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        user_id,
                        post_id,
                        platform,
                        ip,
                        Math.floor(Date.now() / 1000)
                    ]
                );

                // 更新帖子分享次数
                await connection.execute(
                    'UPDATE t_post SET share_num = share_num + 1 WHERE id = ?',
                    [post_id]
                );

                await connection.commit();
                return res.json(Response.success(null, '分享成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Record share error:', err);
            return res.json(Response.error('记录分享失败'));
        }
    }

    // 获取分享统计
    static async stats(req, res) {
        try {
            const { post_id } = req.query;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            // 获取总分享次数
            const [total] = await db.execute(
                'SELECT share_num FROM t_post WHERE id = ?',
                [post_id]
            );

            // 获取平台分布
            const [platforms] = await db.execute(
                `SELECT platform, COUNT(*) as count 
                FROM t_share_log 
                WHERE post_id = ? AND platform IS NOT NULL
                GROUP BY platform`,
                [post_id]
            );

            return res.json(Response.success({
                total: total[0]?.share_num || 0,
                platforms
            }));
        } catch (err) {
            console.error('Get share stats error:', err);
            return res.json(Response.error('获取分享统计失败'));
        }
    }
}

module.exports = ShareController; 