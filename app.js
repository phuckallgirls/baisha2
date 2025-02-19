const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();
const { initDatabase } = require('./scripts/init-db');

// 导入所有路由
const indexRoutes = require('./application/api/routes/index');
const userRoutes = require('./application/api/routes/user');
const postRoutes = require('./application/api/routes/post');
const commentRoutes = require('./application/api/routes/comment');
const wechatRoutes = require('./application/api/routes/wechat');
const commonRoutes = require('./application/api/routes/common');
const captchaRoutes = require('./application/api/routes/captcha');
const tokenRoutes = require('./application/api/routes/token');
const messageRoutes = require('./application/api/routes/message');
const searchRoutes = require('./application/api/routes/search');
const feedbackRoutes = require('./application/api/routes/feedback');
const reportRoutes = require('./application/api/routes/report');
const addressRoutes = require('./application/api/routes/address');
const historyRoutes = require('./application/api/routes/history');
const shareRoutes = require('./application/api/routes/share');
const favoriteRoutes = require('./application/api/routes/favorite');
const followRoutes = require('./application/api/routes/follow');
const blacklistRoutes = require('./application/api/routes/blacklist');
const stickRoutes = require('./application/api/routes/stick');
const recommendRoutes = require('./application/api/routes/recommend');
const auditRoutes = require('./application/api/routes/audit');
const categoryRoutes = require('./application/api/routes/category');
const tagRoutes = require('./application/api/routes/tag');
const configRoutes = require('./application/api/routes/config');

const app = express();

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// session配置
app.use(session({
    secret: process.env.SESSION_SECRET || 'smart-community-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 15 // 15分钟
    }
}));

// 静态文件服务
app.use('/uploads', express.static('public/uploads'));

// 注册所有路由
app.use('/api', indexRoutes);          // 首页相关接口
app.use('/api/user', userRoutes);      // 用户相关接口
app.use('/api/post', postRoutes);      // 信息相关接口
app.use('/api/comment', commentRoutes); // 评论相关接口
app.use('/api/wechat', wechatRoutes);  // 微信相关接口
app.use('/api/common', commonRoutes);   // 公共接口
app.use('/api/captcha', captchaRoutes);  // 验证码相关接口
app.use('/api/token', tokenRoutes);      // Token相关接口
app.use('/api/message', messageRoutes);  // 消息相关接口
app.use('/api/search', searchRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/stick', stickRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/tag', tagRoutes);
app.use('/api/config', configRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        code: 500,
        msg: '服务器错误',
        time: Math.floor(Date.now() / 1000)
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

// 先初始化数据库，然后再启动服务器
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

module.exports = app; 