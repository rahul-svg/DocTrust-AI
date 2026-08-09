import { Router } from 'express';
import multer from 'multer';
import { processOcr } from '../controllers/ocrController';
import { processVerify, processClassify } from '../controllers/verifyController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/ocr', upload.single('file'), processOcr);
router.post('/verify', upload.single('file'), processVerify);
router.post('/classify', processClassify);

export default router;
