const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../../config/database');

class Auth {
    constructor() {
        this.error = '';
        this.logined = false;
        this.user = null;
    }

    // 登录验证
    async login(username, password) {
        try {
            // 查找用户
            const [users] = await db.execute(
                'SELECT * FROM t_user WHERE username = ?',
                [username]
            );

            if (!users.length) {
                this.error = '用户不存在';
                return false;
            }

            const user = users[0];

            // 验证密码
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                this.error = '密码错误';
                return false;
            }

            this.user = user;
            this.logined = true;

            // 生成token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            return token;
        } catch (err) {
            console.error('Login error:', err);
            this.error = '登录失败';
            return false;
        }
    }

    // 验证token
    async check(token) {
        try {
            if (!token) {
                this.error = 'token不能为空';
                return false;
            }

            // 验证token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 查找用户
            const [users] = await db.execute(
                'SELECT * FROM t_user WHERE id = ?',
                [decoded.id]
            );

            if (!users.length) {
                this.error = '用户不存在';
                return false;
            }

            this.user = users[0];
            this.logined = true;
            return true;
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                this.error = 'token已过期';
            } else {
                this.error = 'token无效';
            }
            return false;
        }
    }

    // 获取错误信息
    getError() {
        return this.error;
    }

    // 获取当前登录用户信息
    getUser() {
        return this.user;
    }

    // 是否已登录
    isLogin() {
        return this.logined;
    }
}

module.exports = new Auth(); 