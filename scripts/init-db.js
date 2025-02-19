require('dotenv').config();
const mysql = require('mysql2/promise');

const tables = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS t_user (
        id int(11) NOT NULL AUTO_INCREMENT,
        username varchar(50) NOT NULL COMMENT '用户名',
        nickname varchar(50) DEFAULT NULL COMMENT '昵称',
        password varchar(255) NOT NULL COMMENT '密码',
        salt varchar(30) DEFAULT NULL COMMENT '密码盐',
        mobile varchar(11) DEFAULT NULL COMMENT '手机号',
        avatar varchar(255) DEFAULT NULL COMMENT '头像',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        UNIQUE KEY username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'`,

    // 分类表
    `CREATE TABLE IF NOT EXISTS t_category (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(50) NOT NULL COMMENT '分类名称',
        description varchar(255) DEFAULT NULL COMMENT '分类描述',
        sort int(11) DEFAULT '0' COMMENT '排序',
        post_count int(11) DEFAULT '0' COMMENT '帖子数量',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表'`,

    // 标签表
    `CREATE TABLE IF NOT EXISTS t_tag (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(50) NOT NULL COMMENT '标签名称',
        post_count int(11) DEFAULT '0' COMMENT '帖子数量',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表'`,

    // 帖子标签关联表
    `CREATE TABLE IF NOT EXISTS t_post_tag (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '帖子ID',
        tag_id int(11) NOT NULL COMMENT '标签ID',
        PRIMARY KEY (id),
        UNIQUE KEY idx_post_tag (post_id,tag_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子标签关联表'`,

    // 系统配置表
    `CREATE TABLE IF NOT EXISTS t_config (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(50) NOT NULL COMMENT '配置名称',
        \`group\` varchar(50) NOT NULL COMMENT '配置分组',
        title varchar(50) NOT NULL COMMENT '配置标题',
        tip varchar(100) DEFAULT NULL COMMENT '配置提示',
        type varchar(50) DEFAULT NULL COMMENT '配置类型',
        value text COMMENT '配置值',
        sort int(11) DEFAULT '0' COMMENT '排序',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表'`,

    // 信息表
    `CREATE TABLE IF NOT EXISTS t_post (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        category_id int(11) NOT NULL COMMENT '分类ID',
        type varchar(20) DEFAULT 'general' COMMENT '类型',
        title varchar(100) NOT NULL COMMENT '标题',
        description varchar(255) DEFAULT NULL COMMENT '描述',
        content text NOT NULL COMMENT '内容',
        images text COMMENT '图片集',
        view_num int(11) DEFAULT '0' COMMENT '浏览次数',
        like_num int(11) DEFAULT '0' COMMENT '点赞次数',
        comment_num int(11) DEFAULT '0' COMMENT '评论次数',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信息表'`,

    // 点赞表
    `CREATE TABLE IF NOT EXISTS t_post_like (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '信息ID',
        user_id int(11) NOT NULL COMMENT '用户ID',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY post_user (post_id,user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞表'`,

    // 收藏表
    `CREATE TABLE IF NOT EXISTS t_favorite (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        post_id int(11) NOT NULL COMMENT '帖子ID',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_user_post (user_id,post_id),
        KEY idx_post (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表'`,

    // 评论表
    `CREATE TABLE IF NOT EXISTS t_comment (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '信息ID',
        user_id int(11) NOT NULL COMMENT '用户ID',
        content text NOT NULL COMMENT '内容',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表'`,

    // 轮播图表
    `CREATE TABLE IF NOT EXISTS t_banner (
        id int(11) NOT NULL AUTO_INCREMENT,
        title varchar(100) NOT NULL COMMENT '标题',
        image varchar(255) NOT NULL COMMENT '图片',
        url varchar(255) DEFAULT NULL COMMENT '链接',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        weigh int(11) DEFAULT '0' COMMENT '权重',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轮播图表'`,

    // 二手信息扩展表
    `CREATE TABLE IF NOT EXISTS t_post_second (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '信息ID',
        price decimal(10,2) DEFAULT NULL COMMENT '价格',
        original_price decimal(10,2) DEFAULT NULL COMMENT '原价',
        contact varchar(50) DEFAULT NULL COMMENT '联系方式',
        address varchar(255) DEFAULT NULL COMMENT '地址',
        PRIMARY KEY (id),
        UNIQUE KEY post_id (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='二手信息扩展表'`,

    // 房产信息扩展表
    `CREATE TABLE IF NOT EXISTS t_post_house (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '信息ID',
        price decimal(10,2) DEFAULT NULL COMMENT '价格',
        area decimal(10,2) DEFAULT NULL COMMENT '面积',
        room varchar(20) DEFAULT NULL COMMENT '户型',
        floor varchar(20) DEFAULT NULL COMMENT '楼层',
        decoration varchar(20) DEFAULT NULL COMMENT '装修',
        direction varchar(20) DEFAULT NULL COMMENT '朝向',
        year varchar(20) DEFAULT NULL COMMENT '年代',
        contact varchar(50) DEFAULT NULL COMMENT '联系方式',
        address varchar(255) DEFAULT NULL COMMENT '地址',
        PRIMARY KEY (id),
        UNIQUE KEY post_id (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房产信息扩展表'`,

    // 求职招聘信息扩展表
    `CREATE TABLE IF NOT EXISTS t_post_job (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '信息ID',
        salary varchar(50) DEFAULT NULL COMMENT '薪资',
        experience varchar(50) DEFAULT NULL COMMENT '经验要求',
        education varchar(50) DEFAULT NULL COMMENT '学历要求',
        company varchar(100) DEFAULT NULL COMMENT '公司名称',
        contact varchar(50) DEFAULT NULL COMMENT '联系方式',
        address varchar(255) DEFAULT NULL COMMENT '地址',
        PRIMARY KEY (id),
        UNIQUE KEY post_id (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='求职招聘信息扩展表'`,

    // 顺风车信息扩展表
    `CREATE TABLE IF NOT EXISTS t_post_car (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '信息ID',
        start_place varchar(255) DEFAULT NULL COMMENT '出发地',
        end_place varchar(255) DEFAULT NULL COMMENT '目的地',
        time varchar(50) DEFAULT NULL COMMENT '出发时间',
        price decimal(10,2) DEFAULT NULL COMMENT '价格',
        seat_num int(11) DEFAULT NULL COMMENT '座位数',
        contact varchar(50) DEFAULT NULL COMMENT '联系方式',
        PRIMARY KEY (id),
        UNIQUE KEY post_id (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='顺风车信息扩展表'`,

    // 验证码表（用于存储短信验证码）
    `CREATE TABLE IF NOT EXISTS t_sms (
        id int(11) NOT NULL AUTO_INCREMENT,
        mobile varchar(11) NOT NULL COMMENT '手机号',
        code varchar(10) NOT NULL COMMENT '验证码',
        event varchar(30) NOT NULL COMMENT '事件',
        ip varchar(50) NOT NULL COMMENT 'IP',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短信验证码表'`,

    // 用户token表（用于刷新token）
    `CREATE TABLE IF NOT EXISTS t_user_token (
        token varchar(50) NOT NULL COMMENT 'Token',
        user_id int(11) NOT NULL COMMENT '用户ID',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        expiretime int(11) DEFAULT NULL COMMENT '过期时间',
        PRIMARY KEY (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户Token表'`,

    // 修改用户表，添加微信相关字段
    `ALTER TABLE t_user 
    ADD COLUMN IF NOT EXISTS openid varchar(50) DEFAULT NULL COMMENT '微信openid' AFTER mobile,
    ADD COLUMN IF NOT EXISTS gender tinyint(1) DEFAULT NULL COMMENT '性别:0=未知,1=男,2=女' AFTER avatar,
    ADD UNIQUE KEY IF NOT EXISTS openid (openid)`,

    // 修改配置表，添加基础配置
    `INSERT IGNORE INTO t_config (name, value, status, createtime, updatetime) VALUES
    ('site_name', 'Smart Community', 'normal', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('site_description', 'A smart community platform', 'normal', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('upload_size_limit', '5242880', 'normal', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('upload_mime_type', 'jpg,png,gif,jpeg,mp4,pdf,doc,docx', 'normal', UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`,

    // 添加帖子表的索引
    `ALTER TABLE t_post 
    ADD INDEX IF NOT EXISTS idx_category (category_id),
    ADD INDEX IF NOT EXISTS idx_user (user_id),
    ADD INDEX IF NOT EXISTS idx_createtime (createtime)`,

    // 添加评论表的索引
    `ALTER TABLE t_comment 
    ADD INDEX IF NOT EXISTS idx_post (post_id),
    ADD INDEX IF NOT EXISTS idx_user (user_id),
    ADD INDEX IF NOT EXISTS idx_createtime (createtime)`,

    // 消息通知表
    `CREATE TABLE IF NOT EXISTS t_message (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '接收用户ID',
        from_id int(11) DEFAULT NULL COMMENT '发送用户ID',
        type varchar(20) NOT NULL COMMENT '消息类型:system=系统消息,comment=评论消息,like=点赞消息',
        title varchar(100) DEFAULT NULL COMMENT '消息标题',
        content text COMMENT '消息内容',
        post_id int(11) DEFAULT NULL COMMENT '关联的帖子ID',
        comment_id int(11) DEFAULT NULL COMMENT '关联的评论ID',
        is_read tinyint(1) DEFAULT '0' COMMENT '是否已读:0=未读,1=已读',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_user (user_id),
        KEY idx_from (from_id),
        KEY idx_post (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知表'`,

    // 搜索历史表
    `CREATE TABLE IF NOT EXISTS t_search_log (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        keyword varchar(100) NOT NULL COMMENT '搜索关键词',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='搜索历史表'`,

    // 用户反馈表
    `CREATE TABLE IF NOT EXISTS t_feedback (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        type varchar(20) NOT NULL COMMENT '反馈类型',
        content text NOT NULL COMMENT '反馈内容',
        images text COMMENT '图片',
        contact varchar(50) DEFAULT NULL COMMENT '联系方式',
        status enum('pending','processed','rejected') DEFAULT 'pending' COMMENT '状态',
        reply text COMMENT '回复内容',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表'`,

    // 举报表
    `CREATE TABLE IF NOT EXISTS t_report (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '举报人ID',
        type varchar(20) NOT NULL COMMENT '举报类型:post=帖子,comment=评论',
        target_id int(11) NOT NULL COMMENT '举报目标ID',
        reason varchar(50) NOT NULL COMMENT '举报原因',
        content text COMMENT '补充说明',
        images text COMMENT '图片',
        status enum('pending','processed','rejected') DEFAULT 'pending' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_user (user_id),
        KEY idx_target (type,target_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表'`,

    // 举报原因配置表
    `CREATE TABLE IF NOT EXISTS t_report_reason (
        id int(11) NOT NULL AUTO_INCREMENT,
        type varchar(20) NOT NULL COMMENT '举报类型:post=帖子,comment=评论',
        name varchar(50) NOT NULL COMMENT '原因名称',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        weigh int(11) DEFAULT '0' COMMENT '权重',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报原因配置表'`,

    // 插入默认的举报原因
    `INSERT IGNORE INTO t_report_reason (type, name, status, weigh, createtime, updatetime) VALUES
    ('post', '垃圾广告', 'normal', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('post', '违法违规', 'normal', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('post', '色情低俗', 'normal', 3, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('post', '政治敏感', 'normal', 4, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('post', '其他原因', 'normal', 5, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('comment', '垃圾广告', 'normal', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('comment', '违法违规', 'normal', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('comment', '色情低俗', 'normal', 3, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('comment', '政治敏感', 'normal', 4, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('comment', '其他原因', 'normal', 5, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`,

    // 用户地址表
    `CREATE TABLE IF NOT EXISTS t_user_address (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        name varchar(50) NOT NULL COMMENT '联系人',
        mobile varchar(11) NOT NULL COMMENT '手机号',
        province varchar(100) NOT NULL COMMENT '省份',
        city varchar(100) NOT NULL COMMENT '城市',
        district varchar(100) NOT NULL COMMENT '区县',
        address varchar(255) NOT NULL COMMENT '详细地址',
        is_default tinyint(1) DEFAULT '0' COMMENT '是否默认:0=否,1=是',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户地址表'`,

    // 浏览历史表
    `CREATE TABLE IF NOT EXISTS t_view_history (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        post_id int(11) NOT NULL COMMENT '帖子ID',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_user_post (user_id,post_id),
        KEY idx_createtime (createtime)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='浏览历史表'`,

    // 分享记录表
    `CREATE TABLE IF NOT EXISTS t_share_log (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) DEFAULT NULL COMMENT '用户ID',
        post_id int(11) NOT NULL COMMENT '帖子ID',
        platform varchar(20) DEFAULT NULL COMMENT '分享平台',
        ip varchar(50) NOT NULL COMMENT 'IP地址',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        KEY idx_post (post_id),
        KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享记录表'`,

    // 修改帖子表，添加分享次数字段
    `ALTER TABLE t_post 
    ADD COLUMN IF NOT EXISTS share_num int(11) DEFAULT '0' COMMENT '分享次数' AFTER like_num`,

    // 修改用户表，添加默认地址字段
    `ALTER TABLE t_user 
    ADD COLUMN IF NOT EXISTS default_address_id int(11) DEFAULT NULL COMMENT '默认地址ID' AFTER mobile`,

    // 修改帖子表，添加收藏次数字段
    `ALTER TABLE t_post 
    ADD COLUMN IF NOT EXISTS favorite_num int(11) DEFAULT '0' COMMENT '收藏次数' AFTER share_num`,

    // 修改用户表，添加关注数和粉丝数字段
    `ALTER TABLE t_user 
    ADD COLUMN IF NOT EXISTS follow_num int(11) DEFAULT '0' COMMENT '关注数' AFTER mobile,
    ADD COLUMN IF NOT EXISTS fans_num int(11) DEFAULT '0' COMMENT '粉丝数' AFTER follow_num`,

    // 置顶表
    `CREATE TABLE IF NOT EXISTS t_stick (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '帖子ID',
        admin_id int(11) NOT NULL COMMENT '操作人ID',
        stick_time int(11) DEFAULT NULL COMMENT '置顶时间',
        end_time int(11) DEFAULT NULL COMMENT '结束时间',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_post (post_id),
        KEY idx_admin (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='置顶表'`,

    // 推荐表
    `CREATE TABLE IF NOT EXISTS t_recommend (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '帖子ID',
        admin_id int(11) NOT NULL COMMENT '操作人ID',
        recommend_time int(11) DEFAULT NULL COMMENT '推荐时间',
        end_time int(11) DEFAULT NULL COMMENT '结束时间',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_post (post_id),
        KEY idx_admin (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐表'`,

    // 审核表
    `CREATE TABLE IF NOT EXISTS t_audit (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '帖子ID',
        admin_id int(11) DEFAULT NULL COMMENT '审核人ID',
        status enum('pending','approved','rejected') DEFAULT 'pending' COMMENT '状态',
        reason varchar(255) DEFAULT NULL COMMENT '原因',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_post (post_id),
        KEY idx_admin (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核表'`,

    // 修改帖子表，添加置顶和推荐状态字段
    `ALTER TABLE t_post 
    ADD COLUMN IF NOT EXISTS is_stick tinyint(1) DEFAULT '0' COMMENT '是否置顶' AFTER status,
    ADD COLUMN IF NOT EXISTS is_recommend tinyint(1) DEFAULT '0' COMMENT '是否推荐' AFTER is_stick`,

    // 修改帖子表，添加分类ID字段
    `ALTER TABLE t_post 
    ADD COLUMN IF NOT EXISTS category_id int(11) DEFAULT NULL COMMENT '分类ID' AFTER user_id`,

    // 用户关注表
    `CREATE TABLE IF NOT EXISTS t_follow (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        follow_id int(11) NOT NULL COMMENT '关注的用户ID',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_user_follow (user_id,follow_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注表'`,

    // 黑名单表
    `CREATE TABLE IF NOT EXISTS t_blacklist (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        block_id int(11) NOT NULL COMMENT '被拉黑的用户ID',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY idx_user_block (user_id,block_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='黑名单表'`,

    // 评论回复表
    `CREATE TABLE IF NOT EXISTS t_comment_reply (
        id int(11) NOT NULL AUTO_INCREMENT,
        comment_id int(11) NOT NULL COMMENT '评论ID',
        user_id int(11) NOT NULL COMMENT '用户ID',
        reply_id int(11) DEFAULT NULL COMMENT '回复的评论ID',
        content text NOT NULL COMMENT '内容',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_comment (comment_id),
        KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论回复表'`,

    // 修改用户表，添加新字段
    `ALTER TABLE t_user 
    ADD COLUMN IF NOT EXISTS score int(11) DEFAULT '0' COMMENT '用户积分' AFTER mobile,
    ADD COLUMN IF NOT EXISTS last_login_time int(11) DEFAULT NULL COMMENT '最后登录时间' AFTER updatetime,
    ADD COLUMN IF NOT EXISTS last_login_ip varchar(50) DEFAULT NULL COMMENT '最后登录IP' AFTER last_login_time`,

    // 修改帖子表，添加新字段
    `ALTER TABLE t_post 
    ADD COLUMN IF NOT EXISTS location varchar(255) DEFAULT NULL COMMENT '位置信息' AFTER content,
    ADD COLUMN IF NOT EXISTS ip varchar(50) DEFAULT NULL COMMENT '发布IP' AFTER location`,

    // 修改评论表，添加新字段
    `ALTER TABLE t_comment 
    ADD COLUMN IF NOT EXISTS ip varchar(50) DEFAULT NULL COMMENT '评论IP' AFTER content,
    ADD COLUMN IF NOT EXISTS reply_count int(11) DEFAULT '0' COMMENT '回复数量' AFTER content`
];

// 添加新的外键约束
const constraints = [
    // 用户默认地址外键
    `ALTER TABLE t_user 
    ADD CONSTRAINT IF NOT EXISTS fk_user_address 
    FOREIGN KEY (default_address_id) 
    REFERENCES t_user_address(id) 
    ON DELETE SET NULL`,

    // 浏览历史外键
    `ALTER TABLE t_view_history 
    ADD CONSTRAINT IF NOT EXISTS fk_view_history_post 
    FOREIGN KEY (post_id) 
    REFERENCES t_post(id) 
    ON DELETE CASCADE`,

    // 分享记录外键
    `ALTER TABLE t_share_log 
    ADD CONSTRAINT IF NOT EXISTS fk_share_log_post 
    FOREIGN KEY (post_id) 
    REFERENCES t_post(id) 
    ON DELETE CASCADE`,

    // 收藏表外键
    `ALTER TABLE t_favorite 
    ADD CONSTRAINT fk_favorite_post 
    FOREIGN KEY (post_id) 
    REFERENCES t_post(id) 
    ON DELETE CASCADE`,

    // 关注表外键
    `ALTER TABLE t_follow 
    ADD CONSTRAINT fk_follow_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES t_user(id) 
    ON DELETE CASCADE`,

    `ALTER TABLE t_follow 
    ADD CONSTRAINT fk_follow_follow_id 
    FOREIGN KEY (follow_id) 
    REFERENCES t_user(id) 
    ON DELETE CASCADE`,

    // 黑名单表外键
    `ALTER TABLE t_blacklist 
    ADD CONSTRAINT fk_blacklist_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES t_user(id) 
    ON DELETE CASCADE`,

    `ALTER TABLE t_blacklist 
    ADD CONSTRAINT fk_blacklist_block_id 
    FOREIGN KEY (block_id) 
    REFERENCES t_user(id) 
    ON DELETE CASCADE`,

    // 置顶表外键
    `ALTER TABLE t_stick 
    ADD CONSTRAINT fk_stick_post 
    FOREIGN KEY (post_id) 
    REFERENCES t_post(id) 
    ON DELETE CASCADE`,

    // 推荐表外键
    `ALTER TABLE t_recommend 
    ADD CONSTRAINT fk_recommend_post 
    FOREIGN KEY (post_id) 
    REFERENCES t_post(id) 
    ON DELETE CASCADE`,

    // 审核表外键
    `ALTER TABLE t_audit 
    ADD CONSTRAINT fk_audit_post 
    FOREIGN KEY (post_id) 
    REFERENCES t_post(id) 
    ON DELETE CASCADE`,

    // 帖子分类外键
    `ALTER TABLE t_post 
    ADD CONSTRAINT fk_post_category 
    FOREIGN KEY (category_id) 
    REFERENCES t_category(id)`,

    // 帖子标签关联表外键
    `ALTER TABLE t_post_tag 
    ADD CONSTRAINT fk_post_tag_post 
    FOREIGN KEY (post_id) 
    REFERENCES t_post(id) 
    ON DELETE CASCADE`,

    `ALTER TABLE t_post_tag 
    ADD CONSTRAINT fk_post_tag_tag 
    FOREIGN KEY (tag_id) 
    REFERENCES t_tag(id) 
    ON DELETE CASCADE`,

    // 评论回复表外键
    `ALTER TABLE t_comment_reply 
    ADD CONSTRAINT fk_reply_comment 
    FOREIGN KEY (comment_id) 
    REFERENCES t_comment(id) 
    ON DELETE CASCADE`,

    `ALTER TABLE t_comment_reply 
    ADD CONSTRAINT fk_reply_user 
    FOREIGN KEY (user_id) 
    REFERENCES t_user(id)`
];

async function initDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    try {
        // 创建数据库
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('Database created or already exists.');

        // 使用数据库
        await connection.query(`USE ${process.env.DB_DATABASE}`);

        // 创建表
        for (const table of tables) {
            await connection.query(table);
            console.log('Table created or already exists.');
        }

        // 添加约束
        for (const constraint of constraints) {
            try {
                await connection.query(constraint);
            } catch (err) {
                // 忽略约束已存在的错误
                if (!err.message.includes('Duplicate key name')) {
                    throw err;
                }
            }
        }

        // 插入一些基础配置
        const configs = [
            ['site_name', 'Smart Community Platform', 'normal', Math.floor(Date.now() / 1000)],
            ['site_description', 'A smart community platform', 'normal', Math.floor(Date.now() / 1000)]
        ];

        await connection.query(
            'INSERT IGNORE INTO t_config (name, value, status, createtime) VALUES ?',
            [configs]
        );
        console.log('Basic configs inserted.');

        console.log('Database initialization completed successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

initDatabase(); 