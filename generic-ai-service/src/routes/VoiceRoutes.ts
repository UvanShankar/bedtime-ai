import { Router } from 'express';
import multer from 'multer';
import voiceCloningController from '../controller/VoiceCloningController';
import { ApiError } from '../exceptions/ApiError';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max sample
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.match(/\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new ApiError('Invalid file type. Only audio files are allowed.', 400));
    }
  },
});

const handleAudioUpload = (req: any, res: any, next: any) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

const router = Router();

// Upload audio sample for voice cloning (multipart file or JSON audioBase64)
router.post('/upload-sample', handleAudioUpload, (req, res, next) => voiceCloningController.uploadSample(req, res, next));
router.post('/samples', handleAudioUpload, (req, res, next) => voiceCloningController.uploadSample(req, res, next));

// Presigned S3 upload URL for direct-to-S3 uploads
router.post('/presigned-sample-url', (req, res, next) => voiceCloningController.getPresignedSampleUrl(req, res, next));

// Voice cloning and registry routes (supports coupled voiceId and provider)
router.post('/clone', (req, res, next) => voiceCloningController.cloneVoice(req, res, next));
router.get('/:voiceId/:provider', (req, res, next) => voiceCloningController.getVoice(req, res, next));
router.get('/:voiceId', (req, res, next) => voiceCloningController.getVoice(req, res, next));

export const voiceRoutes = router;
