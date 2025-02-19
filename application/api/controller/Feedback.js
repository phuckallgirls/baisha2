const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class FeedbackController {
    // 提交反馈
    static async create(req, res) {
        try {
            const user_id = req.user.id;
            const { type, content, images = [], contact } = req.body;

            if (!type || !content) {
                return res.json(Response.error('请填写完整信息'));
            }

            await db.execute(
                `INSERT INTO t_feedback 
                (user_id, type, content, images, contact, status, createtime, updatetime)
                VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
                [
                    user_id,
                    type,
                    content,
                    JSON.stringify(images),
                    contact,
                    Math.floor(Date.now() / 1000),
                    Math.floor(Date.now() / 1000)
                ]
            );

            return res.json(Response.success(null, '提交成功'));
        } catch (err) {
            console.error('Create feedback error:', err);
            return res.json(Response.error('提交反馈失败'));
        }
    }

    // 获取反馈列表
    static async list(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_feedback WHERE user_id = ?',
                [user_id]
            );

            // 获取列表
            const [feedbacks] = await db.execute(
                `SELECT * FROM t_feedback 
                WHERE user_id = ?
                ORDER BY id DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            // 处理图片字段
            feedbacks.forEach(feedback => {
                feedback.images = feedback.images ? JSON.parse(feedback.images) : [];
            });

            return res.json(Response.success({
                total: countResult[0].total,
                list: feedbacks
            }));
        } catch (err) {
            console.error('Get feedback list error:', err);
            return res.json(Response.error('获取反馈列表失败'));
        }
    }
}

module.exports = FeedbackController; 