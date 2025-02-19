const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class MessageController {
    // 获取未读消息数量
    static async getUnReadNum(req, res) {
        try {
            const user_id = req.user.id;

            const [result] = await db.execute(
                'SELECT COUNT(*) as count FROM t_message WHERE user_id = ? AND is_read = 0',
                [user_id]
            );

            return res.json(Response.success({ count: result[0].count }));
        } catch (err) {
            console.error('Get unread message count error:', err);
            return res.json(Response.error('获取未读消息数量失败'));
        }
    }

    // 获取消息列表
    static async list(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_message WHERE user_id = ?',
                [user_id]
            );

            // 获取列表
            const [messages] = await db.execute(
                `SELECT 
                    m.*, 
                    u.nickname as from_nickname, 
                    u.avatar as from_avatar,
                    p.title as post_title
                FROM t_message m
                LEFT JOIN t_user u ON m.from_id = u.id
                LEFT JOIN t_post p ON m.post_id = p.id
                WHERE m.user_id = ?
                ORDER BY m.id DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: messages
            }));
        } catch (err) {
            console.error('Get message list error:', err);
            return res.json(Response.error('获取消息列表失败'));
        }
    }

    // 标记消息为已读
    static async read(req, res) {
        try {
            const user_id = req.user.id;
            const { id } = req.params;

            if (id === 'all') {
                // 标记所有消息为已读
                await db.execute(
                    'UPDATE t_message SET is_read = 1 WHERE user_id = ? AND is_read = 0',
                    [user_id]
                );
            } else {
                // 标记单条消息为已读
                await db.execute(
                    'UPDATE t_message SET is_read = 1 WHERE id = ? AND user_id = ?',
                    [id, user_id]
                );
            }

            return res.json(Response.success(null, '标记成功'));
        } catch (err) {
            console.error('Mark message as read error:', err);
            return res.json(Response.error('标记失败'));
        }
    }
}

module.exports = MessageController; 