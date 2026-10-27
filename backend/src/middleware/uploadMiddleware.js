/**
 * Upload Middleware
 * Configures multer for handling multipart/form-data file uploads.
 * Uses in-memory storage so the buffer can either be written to local disk
 * or streamed to S3 depending on configuration.
 */

const multer = require('multer');

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // ~2MB

const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error('Invalid file type. Only PNG, JPG and WEBP images are allowed.'));
};

/**
 * Single logo upload middleware (field name: "logo").
 */
const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_LOGO_SIZE },
  fileFilter: imageFileFilter
}).single('logo');

const MAX_CSV_SIZE = 5 * 1024 * 1024; // ~5MB

const ALLOWED_CSV_MIME = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
  'application/octet-stream'
];

const csvFileFilter = (req, file, cb) => {
  const lower = (file.originalname || '').toLowerCase();
  if (ALLOWED_CSV_MIME.includes(file.mimetype) || lower.endsWith('.csv')) {
    return cb(null, true);
  }
  return cb(new Error('Invalid file type. Only CSV files are allowed.'));
};

/**
 * Single CSV upload middleware (field name: "file"). Buffer kept in memory so
 * it can be parsed directly. Used by bank statements + bulk CSV import.
 */
const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CSV_SIZE },
  fileFilter: csvFileFilter
}).single('file');

/**
 * Wrap a multer middleware so multer errors return a clean 400 JSON response
 * instead of bubbling to the global error handler.
 */
function handleUpload(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'File upload failed' });
      }
      next();
    });
  };
}

module.exports = {
  uploadLogo,
  uploadCsv,
  handleUpload,
  MAX_LOGO_SIZE,
  MAX_CSV_SIZE,
  ALLOWED_IMAGE_MIME,
  ALLOWED_CSV_MIME
};
