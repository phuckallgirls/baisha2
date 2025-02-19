const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class ReportController {
    // 获取举报原因列表
    static async reasons(req, res) {
        try {
            const { type } = req.query;

            if (!type) {
                return res.json(Response.error('参数错误'));
            }

            const [reasons] = await db.execute(
                'SELECT id, name FROM t_report_reason WHERE type = ? AND status = "normal" ORDER BY weigh ASC',
                [type]
            );

            return res.json(Response.success(reasons));
        } catch (err) {
            console.error('Get report reasons error:', err);
            return res.json(Response.error('获取举报原因失败'));
        }
    }

    // 提交举报
    static async create(req, res) {
        try {
            const user_id = req.user.id;
            const { type, target_id, reason, content = '', images = [] } = req.body;

            if (!type || !target_id || !reason) {
                return res.json(Response.error('请填写完整信息'));
            }

            // 检查是否已举报过
            const [exists] = await db.execute(
                'SELECT id FROM t_report WHERE user_id = ? AND type = ? AND target_id = ? AND status = "pending"',
                [user_id, type, target_id]
            );

            if (exists.length) {
                return res.json(Response.error('您已举报过该内容'));
            }

            await db.execute(
                `INSERT INTO t_report 
                (user_id, type, target_id, reason, content, images, status, createtime, updatetime)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
                [
                    user_id,
                    type,
                    target_id,
                    reason,
                    content,
                    JSON.stringify(images),
                    Math.floor(Date.now() / 1000),
                    Math.floor(Date.now() / 1000)
                ]
            );

            return res.json(Response.success(null, '举报成功'));
        } catch (err) {
            console.error('Create report error:', err);
            return res.json(Response.error('举报失败'));
        }
    }
}

module.exports = ReportController; 