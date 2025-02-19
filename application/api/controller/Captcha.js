const svgCaptcha = require('svg-captcha');
const Response = require('../../common/utils/response');

class CaptchaController {
    // 生成验证码
    static async generate(req, res) {
        try {
            const captcha = svgCaptcha.create({
                size: 4,          // 验证码长度
                noise: 2,         // 干扰线条数
                color: true,      // 验证码字符将有不同的颜色
                background: '#f0f0f0' // 背景色
            });

            // 将验证码存入session
            req.session.captcha = captcha.text.toLowerCase();
            
            // 设置响应头
            res.type('svg');
            return res.status(200).send(captcha.data);
        } catch (err) {
            console.error('Generate captcha error:', err);
            return res.json(Response.error('生成验证码失败'));
        }
    }

    // 验证验证码
    static async check(req, res) {
        try {
            const { code } = req.query;
            
            if (!code) {
                return res.json(Response.error('请输入验证码'));
            }

            // 验证码校验
            const sessionCaptcha = req.session.captcha;
            if (!sessionCaptcha) {
                return res.json(Response.error('验证码已过期'));
            }

            if (code.toLowerCase() !== sessionCaptcha) {
                return res.json(Response.error('验证码错误'));
            }

            // 验证成功后清除session中的验证码
            delete req.session.captcha;
            
            return res.json(Response.success(null, '验证码正确'));
        } catch (err) {
            console.error('Check captcha error:', err);
            return res.json(Response.error('验证码校验失败'));
        }
    }
}

module.exports = CaptchaController; 