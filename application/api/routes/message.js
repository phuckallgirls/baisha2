const express = require('express');
const router = express.Router();
const Message = require('../controller/Message');
const auth = require('../../common/middleware/auth');

// 获取未读消息数量
router.get('/get_un_read_msg_num', auth, Message.getUnReadNum);

// 获取消息列表
router.get('/list', auth, Message.list);

// 标记消息为已读
router.post('/read/:id', auth, Message.read);

module.exports = router; 