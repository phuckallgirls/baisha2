const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../model/User');
const Response = require('../../common/utils/response');

class Auth {
    // 用户登录
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // 验证参数
            if (!username || !password) {
                return res.json(Response.error('用户名或密码不能为空'));
            }

            // 查找用户
            const user = await User.findByUsername(username);
            if (!user) {
                return res.json(Response.error('用户不存在'));
            }

            // 验证密码
            const isMatch = bcrypt.compareSync(password, user.password);
            if (!isMatch) {
                return res.json(Response.error('密码错误'));
            }

            // 生成token（对应原项目的getToken方法）
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            // 返回用户信息（对应原项目的getUserinfo方法）
            return res.json(Response.success({
                userinfo: {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname || username,
                    mobile: user.mobile,
                    avatar: user.avatar
                },
                token
            }, '登录成功'));
        } catch (err) {
            console.error('Login error:', err);
            return res.json(Response.error('登录失败'));
        }
    }

    // 用户注册
    static async register(req, res) {
        try {
            const { username, password, mobile } = req.body;

            // 验证参数
            if (!username || !password) {
                return res.json(Response.error('用户名或密码不能为空'));
            }

            // 检查用户是否已存在
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                return res.json(Response.error('用户名已被使用'));
            }

            // 创建用户
            const userId = await User.create({
                username,
                password,
                mobile,
                nickname: username
            });

            return res.json(Response.success({ id: userId }, '注册成功'));
        } catch (err) {
            console.error('Register error:', err);
            return res.json(Response.error('注册失败'));
        }
    }
}

module.exports = Auth;