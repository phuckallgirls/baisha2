const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class SearchController {
    // 保存搜索历史
    static async saveLog(req, res) {
        try {
            const user_id = req.user.id;
            const { keyword } = req.body;

            if (!keyword) {
                return res.json(Response.error('请输入搜索关键词'));
            }

            // 检查是否已存在相同的搜索记录
            const [exists] = await db.execute(
                'SELECT id FROM t_search_log WHERE user_id = ? AND keyword = ?',
                [user_id, keyword]
            );

            if (!exists.length) {
                await db.execute(
                    'INSERT INTO t_search_log (user_id, keyword, createtime) VALUES (?, ?, ?)',
                    [user_id, keyword, Math.floor(Date.now() / 1000)]
                );
            }

            return res.json(Response.success());
        } catch (err) {
            console.error('Save search log error:', err);
            return res.json(Response.error('保存搜索历史失败'));
        }
    }

    // 获取搜索历史
    static async getHistory(req, res) {
        try {
            const user_id = req.user.id;
            const { limit = 10 } = req.query;

            const [logs] = await db.execute(
                'SELECT DISTINCT keyword FROM t_search_log WHERE user_id = ? ORDER BY createtime DESC LIMIT ?',
                [user_id, parseInt(limit)]
            );

            return res.json(Response.success(logs.map(log => log.keyword)));
        } catch (err) {
            console.error('Get search history error:', err);
            return res.json(Response.error('获取搜索历史失败'));
        }
    }

    // 清除搜索历史
    static async clearHistory(req, res) {
        try {
            const user_id = req.user.id;

            await db.execute(
                'DELETE FROM t_search_log WHERE user_id = ?',
                [user_id]
            );

            return res.json(Response.success(null, '清除成功'));
        } catch (err) {
            console.error('Clear search history error:', err);
            return res.json(Response.error('清除搜索历史失败'));
        }
    }
}

module.exports = SearchController; 