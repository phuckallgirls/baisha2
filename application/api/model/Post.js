const db = require('../../../config/database');

class Post {
    // 创建帖子
    static async create(postData) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const { 
                user_id, category_id, type = 'general', 
                title, content, images = [], description = ''
            } = postData;

            // 插入主表数据
            const [result] = await connection.execute(
                `INSERT INTO t_post 
                (user_id, category_id, type, title, content, description, images, createtime, updatetime) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user_id,
                    category_id,
                    type,
                    title,
                    content,
                    description,
                    JSON.stringify(images),
                    Math.floor(Date.now() / 1000),
                    Math.floor(Date.now() / 1000)
                ]
            );

            const post_id = result.insertId;

            // 处理扩展表数据
            if (type !== 'general' && postData[type]) {
                const extData = postData[type];
                const fields = Object.keys(extData);
                const values = Object.values(extData);
                
                await connection.execute(
                    `INSERT INTO t_post_${type} 
                    (post_id, ${fields.join(', ')}) 
                    VALUES (?, ${Array(fields.length).fill('?').join(', ')})`,
                    [post_id, ...values]
                );
            }

            await connection.commit();
            return post_id;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    // 获取帖子详情
    static async findById(id) {
        const [posts] = await db.execute(
            `SELECT 
                p.*, u.nickname as user_nickname, u.avatar as user_avatar,
                c.name as category_name
            FROM t_post p
            LEFT JOIN t_user u ON p.user_id = u.id
            LEFT JOIN t_category c ON p.category_id = c.id
            WHERE p.id = ? AND p.status = 'normal'`,
            [id]
        );

        if (!posts.length) return null;

        const post = posts[0];
        post.images = post.images ? JSON.parse(post.images) : [];

        // 获取扩展信息
        if (post.type && post.type !== 'general') {
            const [extInfo] = await db.execute(
                `SELECT * FROM t_post_${post.type} WHERE post_id = ?`,
                [post.id]
            );
            if (extInfo.length) {
                post[post.type] = extInfo[0];
                delete post[post.type].id;
                delete post[post.type].post_id;
            }
        }

        return post;
    }

    // 获取帖子列表
    static async getList(params) {
        const { 
            type, category_id, keyword,
            page = 1, page_size = 10 
        } = params;

        let where = ['p.status = "normal"'];
        let values = [];

        if (type) {
            where.push('p.type = ?');
            values.push(type);
        }

        if (category_id) {
            where.push('p.category_id = ?');
            values.push(category_id);
        }

        if (keyword) {
            where.push('(p.title LIKE ? OR p.content LIKE ?)');
            values.push(`%${keyword}%`, `%${keyword}%`);
        }

        const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

        // 获取总数
        const [countResult] = await db.execute(
            `SELECT COUNT(*) as total 
            FROM t_post p 
            ${whereClause}`,
            values
        );

        // 获取列表
        const [posts] = await db.execute(
            `SELECT 
                p.*, u.nickname as user_nickname, u.avatar as user_avatar,
                c.name as category_name
            FROM t_post p
            LEFT JOIN t_user u ON p.user_id = u.id
            LEFT JOIN t_category c ON p.category_id = c.id
            ${whereClause}
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?`,
            [...values, parseInt(page_size), (page - 1) * page_size]
        );

        // 处理扩展数据
        const formattedPosts = await Promise.all(posts.map(async post => {
            post.images = post.images ? JSON.parse(post.images) : [];
            
            if (post.type && post.type !== 'general') {
                const [extInfo] = await db.execute(
                    `SELECT * FROM t_post_${post.type} WHERE post_id = ?`,
                    [post.id]
                );
                if (extInfo.length) {
                    post[post.type] = extInfo[0];
                    delete post[post.type].id;
                    delete post[post.type].post_id;
                }
            }
            
            return post;
        }));

        return {
            total: countResult[0].total,
            list: formattedPosts
        };
    }
}

module.exports = Post; 