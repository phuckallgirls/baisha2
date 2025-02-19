const Response = require('../../common/utils/response');
const db = require('../../../config/database');
const MessageService = require('../../common/service/Message');

class CommentController {
    // 发表评论
    static async create(req, res) {
        try {
            const user_id = req.user.id;
            const { post_id, content } = req.body;

            // 验证参数
            if (!post_id || !content) {
                return res.json(Response.error('请填写评论内容'));
            }

            // 检查帖子是否存在
            const [posts] = await db.execute(
                'SELECT id, user_id, title FROM t_post WHERE id = ? AND status = "normal"',
                [post_id]
            );

            if (!posts.length) {
                return res.json(Response.error('信息不存在'));
            }

            const post = posts[0];

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 创建评论
                const [result] = await connection.execute(
                    `INSERT INTO t_comment 
                    (post_id, user_id, content, createtime, updatetime) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        post_id,
                        user_id,
                        content,
                        Math.floor(Date.now() / 1000),
                        Math.floor(Date.now() / 1000)
                    ]
                );

                // 更新帖子评论数
                await connection.execute(
                    'UPDATE t_post SET comment_num = comment_num + 1 WHERE id = ?',
                    [post_id]
                );

                // 如果不是评论自己的帖子，才发送消息通知
                if (post.user_id !== user_id) {
                    await MessageService.create({
                        user_id: post.user_id,
                        from_id: user_id,
                        type: 'comment',
                        title: '收到新的评论',
                        content: `有人评论了你的帖子《${post.title}》`,
                        post_id: post_id,
                        comment_id: result.insertId
                    });
                }

                await connection.commit();
                return res.json(Response.success({ id: result.insertId }, '评论成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Create comment error:', err);
            return res.json(Response.error('评论失败'));
        }
    }

    // 获取评论列表
    static async list(req, res) {
        try {
            const { post_id, page = 1, page_size = 10 } = req.query;

            if (!post_id) {
                return res.json(Response.error('参数错误'));
            }

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_comment WHERE post_id = ? AND status = "normal"',
                [post_id]
            );

            // 获取列表
            const [comments] = await db.execute(
                `SELECT 
                    c.*, u.nickname as user_nickname, u.avatar as user_avatar
                FROM t_comment c
                LEFT JOIN t_user u ON c.user_id = u.id
                WHERE c.post_id = ? AND c.status = "normal"
                ORDER BY c.id DESC
                LIMIT ? OFFSET ?`,
                [post_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: comments
            }));
        } catch (err) {
            console.error('Get comment list error:', err);
            return res.json(Response.error('获取评论列表失败'));
        }
    }

    // 删除评论
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            // 检查评论是否存在且属于当前用户
            const [comment] = await db.execute(
                'SELECT post_id FROM t_comment WHERE id = ? AND user_id = ?',
                [id, user_id]
            );

            if (!comment.length) {
                return res.json(Response.error('无权操作'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 软删除评论
                await connection.execute(
                    'UPDATE t_comment SET status = "hidden" WHERE id = ?',
                    [id]
                );

                // 更新帖子评论数
                await connection.execute(
                    'UPDATE t_post SET comment_num = comment_num - 1 WHERE id = ?',
                    [comment[0].post_id]
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
            console.error('Delete comment error:', err);
            return res.json(Response.error('删除失败'));
        }
    }
}

module.exports = CommentController; 