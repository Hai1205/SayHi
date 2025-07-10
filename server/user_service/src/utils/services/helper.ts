import multer from 'multer';

export const uploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedFileTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Định dạng file không được hỗ trợ!'), false);
    }
};

export const upload = multer({
    storage: uploadStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

export const formDataToObject = (req: any) => {
    const result = { ...req.body };

    if (req.file) {
        result.file = {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype
        };
    }

    if (req.files) {
        result.files = req.files.map((file: any) => ({
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype
        }));
    }

    return result;
};

export const parseRequestData = (req: any) => {
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
        return formDataToObject(req);
    } else if (contentType.includes('application/json')) {
        return req.body;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
        return req.body;
    }

    return { ...req.body, ...req.query };
};

export const createOTP = (length = 6): string => {
    const max = Math.pow(10, length);
    return Math.floor(Math.random() * max).toString().padStart(length, '0');
}
  