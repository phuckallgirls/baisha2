const Response = require('../../common/utils/response');
const db = require('../../../config/database');

class AddressController {
    // 获取地址列表
    static async list(req, res) {
        try {
            const user_id = req.user.id;

            const [addresses] = await db.execute(
                'SELECT * FROM t_user_address WHERE user_id = ? ORDER BY is_default DESC, id DESC',
                [user_id]
            );

            return res.json(Response.success(addresses));
        } catch (err) {
            console.error('Get address list error:', err);
            return res.json(Response.error('获取地址列表失败'));
        }
    }

    // 添加地址
    static async create(req, res) {
        try {
            const user_id = req.user.id;
            const { name, mobile, province, city, district, address, is_default = 0 } = req.body;

            // 验证参数
            if (!name || !mobile || !province || !city || !district || !address) {
                return res.json(Response.error('请填写完整信息'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 如果设置为默认地址，先取消其他默认地址
                if (is_default) {
                    await connection.execute(
                        'UPDATE t_user_address SET is_default = 0 WHERE user_id = ?',
                        [user_id]
                    );
                }

                // 添加新地址
                const [result] = await connection.execute(
                    `INSERT INTO t_user_address 
                    (user_id, name, mobile, province, city, district, address, is_default, createtime, updatetime)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        user_id,
                        name,
                        mobile,
                        province,
                        city,
                        district,
                        address,
                        is_default,
                        Math.floor(Date.now() / 1000),
                        Math.floor(Date.now() / 1000)
                    ]
                );

                // 如果设置为默认地址，更新用户表
                if (is_default) {
                    await connection.execute(
                        'UPDATE t_user SET default_address_id = ? WHERE id = ?',
                        [result.insertId, user_id]
                    );
                }

                await connection.commit();
                return res.json(Response.success({ id: result.insertId }, '添加成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Create address error:', err);
            return res.json(Response.error('添加地址失败'));
        }
    }

    // 更新地址
    static async update(req, res) {
        try {
            const user_id = req.user.id;
            const { id } = req.params;
            const { name, mobile, province, city, district, address, is_default = 0 } = req.body;

            // 验证参数
            if (!name || !mobile || !province || !city || !district || !address) {
                return res.json(Response.error('请填写完整信息'));
            }

            // 检查地址是否存在且属于当前用户
            const [addresses] = await db.execute(
                'SELECT id FROM t_user_address WHERE id = ? AND user_id = ?',
                [id, user_id]
            );

            if (!addresses.length) {
                return res.json(Response.error('地址不存在'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 如果设置为默认地址，先取消其他默认地址
                if (is_default) {
                    await connection.execute(
                        'UPDATE t_user_address SET is_default = 0 WHERE user_id = ?',
                        [user_id]
                    );
                }

                // 更新地址
                await connection.execute(
                    `UPDATE t_user_address SET 
                    name = ?, mobile = ?, province = ?, city = ?, district = ?, 
                    address = ?, is_default = ?, updatetime = ?
                    WHERE id = ?`,
                    [
                        name,
                        mobile,
                        province,
                        city,
                        district,
                        address,
                        is_default,
                        Math.floor(Date.now() / 1000),
                        id
                    ]
                );

                // 更新用户默认地址
                if (is_default) {
                    await connection.execute(
                        'UPDATE t_user SET default_address_id = ? WHERE id = ?',
                        [id, user_id]
                    );
                } else if (addresses[0].is_default) {
                    await connection.execute(
                        'UPDATE t_user SET default_address_id = NULL WHERE id = ?',
                        [user_id]
                    );
                }

                await connection.commit();
                return res.json(Response.success(null, '更新成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Update address error:', err);
            return res.json(Response.error('更新地址失败'));
        }
    }

    // 删除地址
    static async delete(req, res) {
        try {
            const user_id = req.user.id;
            const { id } = req.params;

            // 检查地址是否存在且属于当前用户
            const [addresses] = await db.execute(
                'SELECT id, is_default FROM t_user_address WHERE id = ? AND user_id = ?',
                [id, user_id]
            );

            if (!addresses.length) {
                return res.json(Response.error('地址不存在'));
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 删除地址
                await connection.execute(
                    'DELETE FROM t_user_address WHERE id = ?',
                    [id]
                );

                // 如果删除的是默认地址，清除用户默认地址
                if (addresses[0].is_default) {
                    await connection.execute(
                        'UPDATE t_user SET default_address_id = NULL WHERE id = ?',
                        [user_id]
                    );
                }

                await connection.commit();
                return res.json(Response.success(null, '删除成功'));
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Delete address error:', err);
            return res.json(Response.error('删除地址失败'));
        }
    }
}

module.exports = AddressController; 