const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class AuditController {
    // 提交审核
    static async submit(req, res) {
        try {
            const { post_id } = req.body;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            // 检查帖子是否存在
            const [posts] = await db.execute(
                'SELECT id FROM t_post WHERE id = ?',
                [post_id]
            );

            if (!posts.length) {
                return res.json(Response.error('帖子不存在'));
            }

            // 检查是否已提交审核
            const [audits] = await db.execute(
                'SELECT id FROM t_audit WHERE post_id = ?',
                [post_id]
            );

            if (audits.length) {
                return res.json(Response.error('该帖子已在审核中'));
            }

            const now = Math.floor(Date.now() / 1000);
            await db.execute(
                `INSERT INTO t_audit 
                (post_id, status, createtime, updatetime) 
                VALUES (?, 'pending', ?, ?)`,
                [post_id, now, now]
            );

            return res.json(Response.success(null, '提交审核成功'));
        } catch (err) {
            console.error('Submit audit error:', err);
            return res.json(Response.error('提交审核失败'));
        }
    }

    // 审核操作
    static async review(req, res) {
        try {
            const admin_id = req.user.id;
            const { post_id, status, reason = null } = req.body;

            if (!post_id || !status || !['approved', 'rejected'].includes(status)) {
                return res.json(Response.error('参数错误'));
            }

            // 检查审核记录是否存在
            const [audits] = await db.execute(
                'SELECT id, status FROM t_audit WHERE post_id = ?',
                [post_id]
            );

            if (!audits.length) {
                return res.json(Response.error('审核记录不存在'));
            }

            if (audits[0].status !== 'pending') {
                return res.json(Response.error('该帖子已审核'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 更新审核状态
                const now = Math.floor(Date.now() / 1000);
                await connection.execute(
                    `UPDATE t_audit 
                    SET status = ?, reason = ?, admin_id = ?, updatetime = ? 
                    WHERE post_id = ?`,
                    [status, reason, admin_id, now, post_id]
                );

                // 更新帖子状态
                await connection.execute(
                    'UPDATE t_post SET status = ? WHERE id = ?',
                    [status === 'approved' ? 'normal' : 'hidden', post_id]
                );

                await connection.commit();
                return res.json(Response.success(null, '审核操作成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Review audit error:', err);
            return res.json(Response.error('审核操作失败'));
        }
    }

    // 获取审核列表
    static async list(req, res) {
        try {
            const { status = 'pending', page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_audit WHERE status = ?',
                [status]
            );

            // 获取列表
            const [audits] = await db.execute(
                `SELECT a.*, p.title, p.content, p.cover, u.nickname as admin_name
                FROM t_audit a
                LEFT JOIN t_post p ON a.post_id = p.id
                LEFT JOIN t_user u ON a.admin_id = u.id
                WHERE a.status = ?
                ORDER BY a.createtime DESC
                LIMIT ? OFFSET ?`,
                [status, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: audits
            }));
        } catch (err) {
            console.error('Get audit list error:', err);
            return res.json(Response.error('获取审核列表失败'));
        }
    }

    // 获取审核详情
    static async detail(req, res) {
        try {
            const { post_id } = req.query;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            const [audits] = await db.execute(
                `SELECT a.*, p.title, p.content, p.cover, 
                        p.view_num, p.like_num, p.comment_num,
                        u.nickname as admin_name
                FROM t_audit a
                LEFT JOIN t_post p ON a.post_id = p.id
                LEFT JOIN t_user u ON a.admin_id = u.id
                WHERE a.post_id = ?`,
                [post_id]
            );

            if (!audits.length) {
                return res.json(Response.error('审核记录不存在'));
            }

            return res.json(Response.success(audits[0]));
        } catch (err) {
            console.error('Get audit detail error:', err);
            return res.json(Response.error('获取审核详情失败'));
        }
    }
}

module.exports = AuditController; 