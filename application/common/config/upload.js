module.exports = {
    image: {
        mimes: ['image/jpeg', 'image/png', 'image/gif'],
        extensions: ['jpg', 'jpeg', 'png', 'gif'],
        maxSize: 5 * 1024 * 1024  // 5MB
    },
    video: {
        mimes: ['video/mp4', 'video/quicktime', 'video/x-ms-wmv', 'video/x-msvideo'],
        extensions: ['mp4', 'mov', 'wmv', 'avi'],
        maxSize: 50 * 1024 * 1024  // 50MB
    },
    file: {
        mimes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/pdf'],
        extensions: ['doc', 'docx', 'xls', 'xlsx', 'pdf'],
        maxSize: 10 * 1024 * 1024  // 10MB
    }
}; 