const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class Index {
    // 首页初始化数据
    static async init(req, res) {
        try {
            // 获取轮播图
            const [banners] = await db.execute(
                `SELECT id, title, image, url 
                FROM t_banner 
                WHERE status = 'normal' 
                ORDER BY weigh DESC, id DESC 
                LIMIT 5`
            );

            // 获取分类
            const [categories] = await db.execute(
                `SELECT id, name, image, description 
                FROM t_category 
                WHERE status = 'normal' 
                ORDER BY weigh DESC, id ASC`
            );

            // 获取最新信息
            const [posts] = await db.execute(
                `SELECT 
                    p.id, p.title, p.description, p.content, p.images,
                    p.view_num, p.like_num, p.comment_num, p.createtime,
                    u.nickname as user_nickname, u.avatar as user_avatar
                FROM t_post p
                LEFT JOIN t_user u ON p.user_id = u.id
                WHERE p.status = 'normal'
                ORDER BY p.id DESC
                LIMIT 10`
            );

            // 处理帖子图片数组
            const formattedPosts = posts.map(post => ({
                ...post,
                images: post.images ? JSON.parse(post.images) : []
            }));

            return res.json(Response.success({
                banners,
                categories,
                posts: formattedPosts
            }));
        } catch (err) {
            console.error('Init error:', err);
            return res.json(Response.error('获取首页数据失败'));
        }
    }

    // 获取分类列表
    static async categories(req, res) {
        try {
            const [categories] = await db.execute(
                `SELECT id, name, image, description 
                FROM t_category 
                WHERE status = 'normal' 
                ORDER BY weigh DESC, id ASC`
            );

            return res.json(Response.success(categories));
        } catch (err) {
            console.error('Get categories error:', err);
            return res.json(Response.error('获取分类列表失败'));
        }
    }

    // 获取轮播图列表
    static async banners(req, res) {
        try {
            const [banners] = await db.execute(
                `SELECT id, title, image, url 
                FROM t_banner 
                WHERE status = 'normal' 
                ORDER BY weigh DESC, id DESC`
            );

            return res.json(Response.success(banners));
        } catch (err) {
            console.error('Get banners error:', err);
            return res.json(Response.error('获取轮播图失败'));
        }
    }
}

module.exports = Index; 