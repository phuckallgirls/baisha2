const jwt = require('jsonwebtoken');
const Response = require('../utils/response');

module.exports = async (req, res, next) => {
  try {
    // 从header中获取token，支持两种格式：
    // 1. Authorization: Bearer <token>
    // 2. token: <token>
    const token = req.headers.authorization?.split(' ')[1] || req.headers.token;
    
    if (!token) {
      return res.json(Response.error('未登录'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;  // 将用户信息挂载到请求对象上
      next();
    } catch (err) {
      return res.json(Response.error('token无效'));
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.json(Response.error('认证失败'));
  }
};