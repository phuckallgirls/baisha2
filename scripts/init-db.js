require('dotenv').config();
const mysql = require('mysql2/promise');

// 辅助函数：检查并添加列
async function addColumnIfNotExists(connection, table, column, definition, after) {
    try {
        const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
        if (!columns.find(col => col.Field === column)) {
            await connection.query(
                `ALTER TABLE ${table} 
                ADD COLUMN ${column} ${definition} 
                ${after ? `AFTER ${after}` : ''}`
            );
            console.log(`Column ${column} added to ${table} table.`);
        }
    } catch (err) {
        console.error(`Error adding column ${column} to ${table}:`, err);
        throw err;
    }
}

// 辅助函数：检查并添加索引
async function addIndexIfNotExists(connection, table, indexName, columns) {
    try {
        const [indexes] = await connection.query(`SHOW INDEXES FROM ${table}`);
        if (!indexes.find(idx => idx.Key_name === indexName)) {
            await connection.query(
                `ALTER TABLE ${table} 
                ADD ${indexName === 'PRIMARY' ? 'PRIMARY KEY' : `INDEX ${indexName}`} (${columns})`
            );
            console.log(`Index ${indexName} added to ${table} table.`);
        }
    } catch (err) {
        console.error(`Error adding index ${indexName} to ${table}:`, err);
        throw err;
    }
}

// 辅助函数：检查并添加外键
async function addForeignKeyIfNotExists(connection, table, constraintName, definition) {
    try {
        const [constraints] = await connection.query(
            `SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ? 
            AND CONSTRAINT_NAME = ?`,
            [table, constraintName]
        );

        if (constraints.length === 0) {
            await connection.query(
                `ALTER TABLE ${table} 
                ADD CONSTRAINT ${constraintName} ${definition}`
            );
            console.log(`Foreign key ${constraintName} added to ${table} table.`);
        }
    } catch (err) {
        console.error(`Error adding foreign key ${constraintName} to ${table}:`, err);
        // 忽略"外键已存在"错误
        if (!err.message.includes('Duplicate key name')) {
            throw err;
        }
    }
}

const tables = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS t_user (
        id int(11) NOT NULL AUTO_INCREMENT,
        username varchar(50) NOT NULL COMMENT '用户名',
        nickname varchar(50) DEFAULT NULL COMMENT '昵称',
        password varchar(255) NOT NULL COMMENT '密码',
        salt varchar(30) DEFAULT NULL COMMENT '密码盐',
        mobile varchar(11) DEFAULT NULL COMMENT '手机号',
        openid varchar(50) DEFAULT NULL COMMENT '微信openid',
        avatar varchar(255) DEFAULT NULL COMMENT '头像',
        gender tinyint(1) DEFAULT NULL COMMENT '性别:0=未知,1=男,2=女',
        score int(11) DEFAULT '0' COMMENT '用户积分',
        follow_num int(11) DEFAULT '0' COMMENT '关注数',
        fans_num int(11) DEFAULT '0' COMMENT '粉丝数',
        default_address_id int(11) DEFAULT NULL COMMENT '默认地址ID',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        last_login_time int(11) DEFAULT NULL COMMENT '最后登录时间',
        last_login_ip varchar(50) DEFAULT NULL COMMENT '最后登录IP',
        PRIMARY KEY (id),
        UNIQUE KEY mobile (mobile),
        UNIQUE KEY openid (openid)
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

    // 配置表
    `CREATE TABLE IF NOT EXISTS t_config (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(50) NOT NULL COMMENT '配置名称',
        value text COMMENT '配置值',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        UNIQUE KEY name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配置表'`,

    // 帖子表
    `CREATE TABLE IF NOT EXISTS t_post (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL COMMENT '用户ID',
        category_id int(11) NOT NULL COMMENT '分类ID',
        type varchar(20) DEFAULT 'general' COMMENT '类型',
        title varchar(100) NOT NULL COMMENT '标题',
        description varchar(255) DEFAULT NULL COMMENT '描述',
        content text NOT NULL COMMENT '内容',
        images text COMMENT '图片集',
        location varchar(255) DEFAULT NULL COMMENT '位置信息',
        ip varchar(50) DEFAULT NULL COMMENT '发布IP',
        view_num int(11) DEFAULT '0' COMMENT '浏览次数',
        like_num int(11) DEFAULT '0' COMMENT '点赞次数',
        share_num int(11) DEFAULT '0' COMMENT '分享次数',
        favorite_num int(11) DEFAULT '0' COMMENT '收藏次数',
        comment_num int(11) DEFAULT '0' COMMENT '评论次数',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        is_stick tinyint(1) DEFAULT '0' COMMENT '是否置顶',
        is_recommend tinyint(1) DEFAULT '0' COMMENT '是否推荐',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_category (category_id),
        KEY idx_user (user_id),
        KEY idx_createtime (createtime)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子表'`,

    // 点赞表
    `CREATE TABLE IF NOT EXISTS t_post_like (
        id int(11) NOT NULL AUTO_INCREMENT,
        post_id int(11) NOT NULL COMMENT '帖子ID',
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
        post_id int(11) NOT NULL COMMENT '帖子ID',
        user_id int(11) NOT NULL COMMENT '用户ID',
        content text NOT NULL COMMENT '内容',
        ip varchar(50) DEFAULT NULL COMMENT '评论IP',
        reply_count int(11) DEFAULT '0' COMMENT '回复数量',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        updatetime int(11) DEFAULT NULL COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_post (post_id),
        KEY idx_user (user_id),
        KEY idx_createtime (createtime)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表'`,

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

    // 地区表
    `CREATE TABLE IF NOT EXISTS t_area (
        id int(11) NOT NULL AUTO_INCREMENT,
        pid int(11) DEFAULT '0' COMMENT '父ID',
        name varchar(50) NOT NULL COMMENT '名称',
        level tinyint(1) DEFAULT '1' COMMENT '层级',
        sort int(11) DEFAULT '0' COMMENT '排序',
        PRIMARY KEY (id),
        KEY idx_pid (pid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='地区表'`,

    // 版本表
    `CREATE TABLE IF NOT EXISTS t_version (
        id int(11) NOT NULL AUTO_INCREMENT,
        platform varchar(20) NOT NULL COMMENT '平台',
        version varchar(20) NOT NULL COMMENT '版本号',
        content text COMMENT '更新内容',
        url varchar(255) DEFAULT NULL COMMENT '下载地址',
        is_force tinyint(1) DEFAULT '0' COMMENT '是否强制更新',
        status enum('normal','hidden') DEFAULT 'normal' COMMENT '状态',
        createtime int(11) DEFAULT NULL COMMENT '创建时间',
        PRIMARY KEY (id),
        KEY idx_platform (platform)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='版本表'`,

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
    ('comment', '其他原因', 'normal', 5, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`
];

// 外键约束定义
const constraints = [
    // 用户默认地址外键
    {
        table: 't_user',
        name: 'fk_user_address',
        definition: 'FOREIGN KEY (default_address_id) REFERENCES t_user_address(id) ON DELETE SET NULL'
    },

    // 浏览历史外键
    {
        table: 't_view_history',
        name: 'fk_view_history_post',
        definition: 'FOREIGN KEY (post_id) REFERENCES t_post(id) ON DELETE CASCADE'
    },

    // 分享记录外键
    {
        table: 't_share_log',
        name: 'fk_share_log_post',
        definition: 'FOREIGN KEY (post_id) REFERENCES t_post(id) ON DELETE CASCADE'
    },

    // 收藏表外键
    {
        table: 't_favorite',
        name: 'fk_favorite_post',
        definition: 'FOREIGN KEY (post_id) REFERENCES t_post(id) ON DELETE CASCADE'
    },

    // 关注表外键
    {
        table: 't_follow',
        name: 'fk_follow_user_id',
        definition: 'FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE'
    },
    {
        table: 't_follow',
        name: 'fk_follow_follow_id',
        definition: 'FOREIGN KEY (follow_id) REFERENCES t_user(id) ON DELETE CASCADE'
    },

    // 黑名单表外键
    {
        table: 't_blacklist',
        name: 'fk_blacklist_user_id',
        definition: 'FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE'
    },
    {
        table: 't_blacklist',
        name: 'fk_blacklist_block_id',
        definition: 'FOREIGN KEY (block_id) REFERENCES t_user(id) ON DELETE CASCADE'
    },

    // 帖子相关外键
    {
        table: 't_post',
        name: 'fk_post_category',
        definition: 'FOREIGN KEY (category_id) REFERENCES t_category(id)'
    },
    {
        table: 't_post_tag',
        name: 'fk_post_tag_post',
        definition: 'FOREIGN KEY (post_id) REFERENCES t_post(id) ON DELETE CASCADE'
    },
    {
        table: 't_post_tag',
        name: 'fk_post_tag_tag',
        definition: 'FOREIGN KEY (tag_id) REFERENCES t_tag(id) ON DELETE CASCADE'
    }
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
            try {
                await connection.query(table);
                console.log('Table created or already exists.');
            } catch (err) {
                console.error('Error creating table:', err);
                throw err;
            }
        }

        // 添加必要的列
        try {
            await addColumnIfNotExists(
                connection,
                't_user',
                'default_address_id',
                'int(11) DEFAULT NULL COMMENT \'默认地址ID\'',
                'mobile'
            );
        } catch (err) {
            console.error('Error adding columns:', err);
            throw err;
        }

        // 添加外键约束
        for (const constraint of constraints) {
            try {
                await addForeignKeyIfNotExists(
                    connection,
                    constraint.table,
                    constraint.name,
                    constraint.definition
                );
            } catch (err) {
                console.error(`Error adding constraint ${constraint.name}:`, err);
                // 继续执行，不要因为一个约束失败就停止
                continue;
            }
        }

        // 插入基础配置
        try {
            await connection.query(`
                INSERT IGNORE INTO t_config (name, value, createtime, updatetime) VALUES
                ('site_name', 'Smart Community', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
                ('site_description', 'A smart community platform', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
                ('upload_size_limit', '5242880', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
                ('upload_mime_type', 'jpg,png,gif,jpeg,mp4,pdf,doc,docx', UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
            `);
            console.log('Basic configs inserted.');
        } catch (err) {
            console.error('Error inserting configs:', err);
            throw err;
        }

        console.log('Database initialization completed successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    } finally {
        await connection.end();
    }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
    initDatabase().catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
}

// 导出初始化函数供其他模块使用
module.exports = { initDatabase };
