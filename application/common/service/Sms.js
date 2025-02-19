const Core = require('@alicloud/pop-core');
require('dotenv').config();

class SmsService {
    constructor() {
        this.client = new Core({
            accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
            accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
            endpoint: 'https://dysmsapi.aliyuncs.com',
            apiVersion: '2017-05-25'
        });
    }

    async send(mobile, code) {
        const params = {
            "PhoneNumbers": mobile,
            "SignName": process.env.ALIYUN_SMS_SIGN_NAME,
            "TemplateCode": process.env.ALIYUN_SMS_TEMPLATE_CODE,
            "TemplateParam": JSON.stringify({ code })
        };

        try {
            const result = await this.client.request('SendSms', params, {
                method: 'POST'
            });
            return result.Code === 'OK';
        } catch (err) {
            console.error('Send SMS error:', err);
            return false;
        }
    }
}

module.exports = new SmsService(); 