const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { HTTP_STATUS, UPLOAD } = require('#configs/constants');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD.PATH);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);
    const sanitizedFilename = path
      .basename(file.originalname, fileExt)
      .replace(/\s+/g, '_')
      .toLowerCase();

    cb(null, `${uuidv4()}_${sanitizedFilename}${fileExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    const error = new Error('Loại file không được hỗ trợ');
    error.code = 'LIMIT_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: UPLOAD.MAX_SIZE,
  },
});

const uploadFile =
  (fieldName = 'image', required = false) =>
  (req, res, next) => {
    upload.single(fieldName)(req, res, function (err) {
      if (err) {
        let status = HTTP_STATUS.INTERNAL_ERROR;
        let message = err.message;

        if (err.code === 'LIMIT_FILE_TYPE') {
          status = HTTP_STATUS.BAD_REQUEST;
          message = `Chỉ chấp nhận file ảnh: ${UPLOAD.ALLOWED_TYPES.join(', ')}`;
        } else if (err.code === 'LIMIT_FILE_SIZE') {
          status = HTTP_STATUS.BAD_REQUEST;
          message = `Kích thước file không được vượt quá ${UPLOAD.MAX_SIZE / (1024 * 1024)}MB`;
        } else if (err instanceof multer.MulterError) {
          status = HTTP_STATUS.BAD_REQUEST;
        }

        return res.status(status).json({
          success: false,
          message,
        });
      }

      if (required && !req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Vui lòng chọn file để upload',
        });
      }

      next();
    });
  };

module.exports = uploadFile;
