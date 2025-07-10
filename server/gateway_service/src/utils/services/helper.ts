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