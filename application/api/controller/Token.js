const Response = require('../../common/utils/response');
const jwt = require('jsonwebtoken');
const Auth = require('../../common/service/Auth');

class TokenController {
    // 刷新token
    static async refresh(req, res) {
        try {
            const oldToken = req.headers.authorization?.split(' ')[1] || req.headers.token;
            
            if (!oldToken) {
                return res.json(Response.error('token不能为空'));
            }

            // 验证旧token
            try {
                const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
                
                // 生成新token
                const newToken = jwt.sign(
                    { id: decoded.id },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRE }
                );

                return res.json(Response.success({ token: newToken }, '刷新成功'));
            } catch (err) {
                if (err.name === 'TokenExpiredError') {
                    // 如果是过期的token，尝试从过期token中获取用户信息
                    const decoded = jwt.decode(oldToken);
                    if (decoded && decoded.id) {
                        const newToken = jwt.sign(
                            { id: decoded.id },
                            process.env.JWT_SECRET,
                            { expiresIn: process.env.JWT_EXPIRE }
                        );
                        return res.json(Response.success({ token: newToken }, '刷新成功'));
                    }
                }
                return res.json(Response.error('token无效'));
            }
        } catch (err) {
            console.error('Refresh token error:', err);
            return res.json(Response.error('刷新失败'));
        }
    }
}

module.exports = TokenController; 