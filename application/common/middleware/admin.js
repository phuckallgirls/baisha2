const Response = require('../utils/response');

// 管理员权限验证中间件
module.exports = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.json(Response.error('需要管理员权限'));
    }
    next();
}; 