const Response = require('../../common/utils/response');
const User = require('../model/User');
const db = require('../../../config/database');
const bcrypt = require('bcrypt');

class UserController {
    // 获取用户信息
    static async profile(req, res) {
        try {
            const user_id = req.user.id;
            const user = await User.findById(user_id);
            
            if (!user) {
                return res.json(Response.error('用户不存在'));
            }

            // 去除敏感信息
            delete user.password;
            delete user.salt;

            return res.json(Response.success(user));
        } catch (err) {
            console.error('Get profile error:', err);
            return res.json(Response.error('获取用户信息失败'));
        }
    }

    // 更新用户信息
    static async update(req, res) {
        try {
            const user_id = req.user.id;
            const { nickname, avatar, mobile } = req.body;

            if (!nickname) {
                return res.json(Response.error('昵称不能为空'));
            }

            const success = await User.update(user_id, { 
                nickname, 
                avatar, 
                mobile 
            });
            
            if (!success) {
                return res.json(Response.error('更新失败'));
            }

            return res.json(Response.success(null, '更新成功'));
        } catch (err) {
            console.error('Update profile error:', err);
            return res.json(Response.error('更新用户信息失败'));
        }
    }

    // 获取我的发布
    static async posts(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_post WHERE user_id = ? AND status = "normal"',
                [user_id]
            );

            // 获取列表
            const [posts] = await db.execute(
                `SELECT 
                    p.*, c.name as category_name
                FROM t_post p
                LEFT JOIN t_category c ON p.category_id = c.id
                WHERE p.user_id = ? AND p.status = "normal"
                ORDER BY p.id DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: posts.map(post => ({
                    ...post,
                    images: post.images ? JSON.parse(post.images) : []
                }))
            }));
        } catch (err) {
            console.error('Get user posts error:', err);
            return res.json(Response.error('获取发布列表失败'));
        }
    }

    // 获取我的收藏
    static async collects(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, page_size = 10 } = req.query;

            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM t_post_collect WHERE user_id = ?',
                [user_id]
            );

            // 获取列表
            const [posts] = await db.execute(
                `SELECT 
                    p.*, u.nickname as user_nickname, u.avatar as user_avatar,
                    c.name as category_name
                FROM t_post_collect pc
                LEFT JOIN t_post p ON pc.post_id = p.id
                LEFT JOIN t_user u ON p.user_id = u.id
                LEFT JOIN t_category c ON p.category_id = c.id
                WHERE pc.user_id = ? AND p.status = "normal"
                ORDER BY pc.id DESC
                LIMIT ? OFFSET ?`,
                [user_id, parseInt(page_size), (page - 1) * page_size]
            );

            return res.json(Response.success({
                total: countResult[0].total,
                list: posts.map(post => ({
                    ...post,
                    images: post.images ? JSON.parse(post.images) : []
                }))
            }));
        } catch (err) {
            console.error('Get user collects error:', err);
            return res.json(Response.error('获取收藏列表失败'));
        }
    }

    // 修改密码
    static async changePwd(req, res) {
        try {
            const user_id = req.user.id;
            const { oldpassword, newpassword } = req.body;

            if (!oldpassword || !newpassword) {
                return res.json(Response.error('请输入原密码和新密码'));
            }

            // 验证原密码
            const user = await User.findById(user_id);
            const isMatch = await bcrypt.compare(oldpassword, user.password);
            if (!isMatch) {
                return res.json(Response.error('原密码错误'));
            }

            // 生成新密码
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newpassword, salt);

            // 更新密码
            await db.execute(
                'UPDATE t_user SET password = ?, salt = ? WHERE id = ?',
                [hash, salt, user_id]
            );

            return res.json(Response.success(null, '密码修改成功'));
        } catch (err) {
            console.error('Change password error:', err);
            return res.json(Response.error('密码修改失败'));
        }
    }

    // 重置密码（找回密码）
    static async resetPwd(req, res) {
        try {
            const { mobile, code, password } = req.body;

            if (!mobile || !code || !password) {
                return res.json(Response.error('请填写完整信息'));
            }

            // 验证手机验证码
            // 注意：这里需要集成短信验证码服务
            // 为了演示，我们假设验证码是 "1234"
            if (code !== '1234') {
                return res.json(Response.error('验证码错误'));
            }

            // 查找用户
            const [users] = await db.execute(
                'SELECT id FROM t_user WHERE mobile = ?',
                [mobile]
            );

            if (!users.length) {
                return res.json(Response.error('用户不存在'));
            }

            // 生成新密码
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            // 更新密码
            await db.execute(
                'UPDATE t_user SET password = ?, salt = ? WHERE id = ?',
                [hash, salt, users[0].id]
            );

            return res.json(Response.success(null, '密码重置成功'));
        } catch (err) {
            console.error('Reset password error:', err);
            return res.json(Response.error('密码重置失败'));
        }
    }

    // 发送验证码
    static async sendCode(req, res) {
        try {
            const { mobile } = req.body;

            if (!mobile) {
                return res.json(Response.error('请输入手机号'));
            }

            // 注意：这里需要集成短信服务
            // 为了演示，我们只返回成功
            return res.json(Response.success(null, '验证码发送成功'));
        } catch (err) {
            console.error('Send code error:', err);
            return res.json(Response.error('验证码发送失败'));
        }
    }
}

module.exports = UserController; 