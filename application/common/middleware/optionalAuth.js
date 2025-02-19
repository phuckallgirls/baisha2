const jwt = require('jsonwebtoken');
const db = require('../../../config/database');

// 可选认证中间件
module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.headers.token;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const [users] = await db.execute(
                'SELECT * FROM t_user WHERE id = ?',
                [decoded.id]
            );

            if (users.length) {
                req.user = users[0];
            }
        }

        next();
    } catch (err) {
        // 认证失败也继续执行，只是不设置 req.user
        next();
    }
}; 