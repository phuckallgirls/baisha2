const db = require('../../../config/database');
const bcrypt = require('bcryptjs');

class User {
    // 通过用户名查找用户
    static async findByUsername(username) {
        const [rows] = await db.execute(
            'SELECT * FROM t_user WHERE username = ?',
            [username]
        );
        return rows[0];
    }

    // 通过ID查找用户
    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT * FROM t_user WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    // 创建用户（对应原项目的register方法）
    static async create(userData) {
        const { username, password, mobile, nickname } = userData;
        
        // 生成密码盐和加密密码
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        
        const now = Math.floor(Date.now() / 1000);
        
        // 插入用户数据
        const [result] = await db.execute(
            `INSERT INTO t_user 
            (username, password, salt, nickname, mobile, createtime, updatetime) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                username,
                hash,
                salt,
                nickname || username,
                mobile || '',
                now,
                now
            ]
        );

        return result.insertId;
    }

    // 更新用户信息
    static async update(id, data) {
        const { nickname, avatar, mobile } = data;
        const now = Math.floor(Date.now() / 1000);
        
        const [result] = await db.execute(
            `UPDATE t_user 
            SET nickname = ?, avatar = ?, mobile = ?, updatetime = ? 
            WHERE id = ?`,
            [nickname, avatar, mobile, now, id]
        );

        return result.affectedRows > 0;
    }

    // 验证密码（替代原项目的encryptPassword方法）
    static validatePassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }
}

module.exports = User; 