import { Router } from 'express';
import multer from 'multer';
import { processOcr } from '../controllers/ocrController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/ocr', upload.single('file'), processOcr);

export default router;
