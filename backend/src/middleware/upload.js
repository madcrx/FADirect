const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { HTTP_STATUS, VALIDATION } = require('../constants');

// Ensure upload directory exists
const uploadDir = config.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter function
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  };
};

// Document upload configuration
const uploadDocument = multer({
  storage,
  limits: {
    fileSize: VALIDATION.MAX_FILE_SIZE,
  },
  fileFilter: fileFilter(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']),
}).single('file');

// Photo upload configuration
const uploadPhoto = multer({
  storage,
  limits: {
    fileSize: VALIDATION.MAX_FILE_SIZE,
  },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.gif', '.heic']),
}).single('file');

// Video upload configuration
const uploadVideo = multer({
  storage,
  limits: {
    fileSize: VALIDATION.MAX_VIDEO_SIZE,
  },
  fileFilter: fileFilter(['.mp4', '.mov', '.avi', '.wmv']),
}).single('file');

// Generic file upload configuration
const uploadFile = multer({
  storage,
  limits: {
    fileSize: VALIDATION.MAX_FILE_SIZE,
  },
}).single('file');

// Multiple photo upload configuration
const uploadMultiplePhotos = multer({
  storage,
  limits: {
    fileSize: VALIDATION.MAX_FILE_SIZE,
  },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.gif', '.heic']),
}).array('photos', 10); // Max 10 photos at once

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: { message: 'File size exceeds maximum allowed size' },
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: { message: 'Too many files uploaded' },
      });
    }
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: { message: err.message },
    });
  }

  if (err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: { message: err.message },
    });
  }

  next();
};

module.exports = {
  uploadDocument,
  uploadPhoto,
  uploadVideo,
  uploadFile,
  uploadMultiplePhotos,
  handleUploadError,
};
