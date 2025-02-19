const db = require('../../../config/database');

class MessageService {
    // 创建消息
    static async create(data) {
        const { user_id, from_id, type, title, content, post_id, comment_id } = data;
        
        try {
            await db.execute(
                `INSERT INTO t_message 
                (user_id, from_id, type, title, content, post_id, comment_id, createtime, updatetime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user_id,
                    from_id,
                    type,
                    title,
                    content,
                    post_id,
                    comment_id,
                    Math.floor(Date.now() / 1000),
                    Math.floor(Date.now() / 1000)
                ]
            );
            return true;
        } catch (err) {
            console.error('Create message error:', err);
            return false;
        }
    }
}

module.exports = MessageService; 