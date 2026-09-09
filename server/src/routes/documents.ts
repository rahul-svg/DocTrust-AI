import { Router } from 'express';
import { protect } from '../middleware/auth';
import { upload } from '../config/multer';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
} from '../controllers/documentController';
import { verifyDocument } from '../controllers/verificationController';

const router = Router();

router.use(protect);

router.post('/upload', upload.single('document'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);
router.post('/:id/verify', verifyDocument);

export default router;
