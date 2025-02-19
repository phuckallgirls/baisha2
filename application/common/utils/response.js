/**
 * 统一响应格式化（对应原项目的json输出格式）
 */
class Response {
  static success(data = null, msg = 'success') {
    return {
      code: 1,
      msg,
      time: Math.floor(Date.now() / 1000),
      data
    };
  }

  static error(msg = 'error', code = 0) {
    return {
      code,
      msg,
      time: Math.floor(Date.now() / 1000)
    };
  }
}

module.exports = Response; 