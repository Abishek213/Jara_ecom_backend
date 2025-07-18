import multer from 'multer';
import path from 'path';
import { MAX_FILE_UPLOAD } from '../config/constants.js';
import { BadRequestError } from '../utils/errors.js';

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = mimetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Images only!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_UPLOAD },
});

export const uploadSingleImage = upload.single('image');
export const uploadMultipleImages = upload.array('images', 5);