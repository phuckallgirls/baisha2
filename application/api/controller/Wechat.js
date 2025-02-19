const Response = require('../../common/utils/response');
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

class WechatController {
    static async login(req, res) {
        try {
            const { code, userInfo } = req.body;

            if (!code || !userInfo) {
                return res.json(Response.error('参数错误'));
            }

            // 获取openid和session_key
            const result = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
                params: {
                    appid: process.env.WXAPP_ID,
                    secret: process.env.WXAPP_SECRET,
                    js_code: code,
                    grant_type: 'authorization_code'
                }
            });

            if (!result.data.openid) {
                return res.json(Response.error('微信登录失败'));
            }

            // 查找或创建用户
            const [users] = await db.execute(
                'SELECT * FROM t_user WHERE openid = ?',
                [result.data.openid]
            );

            let user;
            if (!users.length) {
                // 创建新用户
                const [result] = await db.execute(
                    `INSERT INTO t_user 
                    (openid, nickname, avatar, gender, createtime, updatetime) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        result.data.openid,
                        userInfo.nickName,
                        userInfo.avatarUrl,
                        userInfo.gender,
                        Math.floor(Date.now() / 1000),
                        Math.floor(Date.now() / 1000)
                    ]
                );
                user = {
                    id: result.insertId,
                    openid: result.data.openid
                };
            } else {
                user = users[0];
            }

            // 生成token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            return res.json(Response.success({ token }));
        } catch (err) {
            console.error('Wechat login error:', err);
            return res.json(Response.error('登录失败'));
        }
    }
}

module.exports = WechatController; 