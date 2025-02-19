const Response = require('../../common/utils/response');
const Post = require('../model/Post');
const db = require('../../../config/database');
const MessageService = require('../../common/service/Message');

class PostController {
    // 发布信息
    static async create(req, res) {
        try {
            const user_id = req.user.id;
            const postData = {
                user_id,
                ...req.body
            };

            // 验证基本字段
            if (!postData.category_id || !postData.title || !postData.content) {
                return res.json(Response.error('请填写完整信息'));
            }

            // 根据不同类型验证特定字段
            switch (postData.type) {
                case 'second':
                    if (!postData.second || !postData.second.price || !postData.second.contact) {
                        return res.json(Response.error('请填写商品价格和联系方式'));
                    }
                    break;
                    
                case 'house':
                    if (!postData.house || !postData.house.price || !postData.house.area || 
                        !postData.house.room || !postData.house.contact) {
                        return res.json(Response.error('请填写房产信息完整'));
                    }
                    break;
                    
                case 'job':
                    if (!postData.job || !postData.job.salary || !postData.job.company || 
                        !postData.job.contact) {
                        return res.json(Response.error('请填写招聘信息完整'));
                    }
                    break;
                    
                case 'car':
                    if (!postData.car || !postData.car.start_place || !postData.car.end_place || 
                        !postData.car.time || !postData.car.contact) {
                        return res.json(Response.error('请填写顺风车信息完整'));
                    }
                    break;
            }

            const post_id = await Post.create(postData);
            return res.json(Response.success({ id: post_id }, '发布成功'));
        } catch (err) {
            console.error('Create post error:', err);
            return res.json(Response.error('发布失败'));
        }
    }

    // 获取信息详情
    static async detail(req, res) {
        try {
            const { id } = req.params;
            const post = await Post.findById(id);
            
            if (!post) {
                return res.json(Response.error('信息不存在'));
            }

            // 增加浏览次数
            await db.execute(
                'UPDATE t_post SET view_num = view_num + 1 WHERE id = ?',
                [id]
            );

            // 检查当前用户是否点赞和收藏
            if (req.user) {
                const [liked] = await db.execute(
                    'SELECT id FROM t_post_like WHERE post_id = ? AND user_id = ?',
                    [id, req.user.id]
                );
                const [collected] = await db.execute(
                    'SELECT id FROM t_post_collect WHERE post_id = ? AND user_id = ?',
                    [id, req.user.id]
                );
                
                post.is_liked = liked.length > 0;
                post.is_collected = collected.length > 0;
            }

            return res.json(Response.success(post));
        } catch (err) {
            console.error('Get post detail error:', err);
            return res.json(Response.error('获取信息详情失败'));
        }
    }

    // 获取信息列表
    static async list(req, res) {
        try {
            const params = req.query;
            const result = await Post.getList(params);

            // 如果用户已登录，检查列表中的信息是否已点赞和收藏
            if (req.user) {
                const user_id = req.user.id;
                const post_ids = result.list.map(post => post.id);
                
                if (post_ids.length > 0) {
                    const [likes] = await db.execute(
                        'SELECT post_id FROM t_post_like WHERE post_id IN (?) AND user_id = ?',
                        [post_ids, user_id]
                    );
                    const [collects] = await db.execute(
                        'SELECT post_id FROM t_post_collect WHERE post_id IN (?) AND user_id = ?',
                        [post_ids, user_id]
                    );

                    const likedIds = likes.map(item => item.post_id);
                    const collectedIds = collects.map(item => item.post_id);

                    result.list = result.list.map(post => ({
                        ...post,
                        is_liked: likedIds.includes(post.id),
                        is_collected: collectedIds.includes(post.id)
                    }));
                }
            }

            return res.json(Response.success(result));
        } catch (err) {
            console.error('Get post list error:', err);
            return res.json(Response.error('获取信息列表失败'));
        }
    }

    // 删除信息
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            // 验证信息所有权
            const [post] = await db.execute(
                'SELECT user_id FROM t_post WHERE id = ?',
                [id]
            );

            if (!post.length || post[0].user_id !== user_id) {
                return res.json(Response.error('无权操作'));
            }

            // 软删除
            await db.execute(
                'UPDATE t_post SET status = "hidden" WHERE id = ?',
                [id]
            );

            return res.json(Response.success(null, '删除成功'));
        } catch (err) {
            console.error('Delete post error:', err);
            return res.json(Response.error('删除失败'));
        }
    }

    // 点赞/取消点赞
    static async like(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            // 检查帖子是否存在
            const [posts] = await db.execute(
                'SELECT id, user_id, title FROM t_post WHERE id = ? AND status = "normal"',
                [id]
            );

            if (!posts.length) {
                return res.json(Response.error('信息不存在'));
            }

            const post = posts[0];

            // 检查是否已点赞
            const [liked] = await db.execute(
                'SELECT id FROM t_post_like WHERE post_id = ? AND user_id = ?',
                [id, user_id]
            );

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                if (liked.length) {
                    // 取消点赞
                    await connection.execute(
                        'DELETE FROM t_post_like WHERE post_id = ? AND user_id = ?',
                        [id, user_id]
                    );
                    await connection.execute(
                        'UPDATE t_post SET like_num = like_num - 1 WHERE id = ?',
                        [id]
                    );
                } else {
                    // 添加点赞
                    await connection.execute(
                        'INSERT INTO t_post_like (post_id, user_id, createtime) VALUES (?, ?, ?)',
                        [id, user_id, Math.floor(Date.now() / 1000)]
                    );
                    await connection.execute(
                        'UPDATE t_post SET like_num = like_num + 1 WHERE id = ?',
                        [id]
                    );

                    // 如果不是给自己的帖子点赞，才发送消息通知
                    if (post.user_id !== user_id) {
                        await MessageService.create({
                            user_id: post.user_id,
                            from_id: user_id,
                            type: 'like',
                            title: '收到新的点赞',
                            content: `有人点赞了你的帖子《${post.title}》`,
                            post_id: id
                        });
                    }
                }

                await connection.commit();
                return res.json(Response.success(null, liked.length ? '取消点赞' : '点赞成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Like post error:', err);
            return res.json(Response.error('操作失败'));
        }
    }

    // 收藏/取消收藏
    static async collect(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            // 检查信息是否存在
            const [post] = await db.execute(
                'SELECT id FROM t_post WHERE id = ? AND status = "normal"',
                [id]
            );

            if (!post.length) {
                return res.json(Response.error('信息不存在'));
            }

            // 检查是否已收藏
            const [collected] = await db.execute(
                'SELECT id FROM t_post_collect WHERE post_id = ? AND user_id = ?',
                [id, user_id]
            );

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                if (collected.length) {
                    // 取消收藏
                    await connection.execute(
                        'DELETE FROM t_post_collect WHERE post_id = ? AND user_id = ?',
                        [id, user_id]
                    );
                } else {
                    // 添加收藏
                    await connection.execute(
                        'INSERT INTO t_post_collect (post_id, user_id, createtime) VALUES (?, ?, ?)',
                        [id, user_id, Math.floor(Date.now() / 1000)]
                    );
                }

                await connection.commit();
                return res.json(Response.success(null, collected.length ? '取消收藏' : '收藏成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Collect post error:', err);
            return res.json(Response.error('操作失败'));
        }
    }
}

module.exports = PostController; 