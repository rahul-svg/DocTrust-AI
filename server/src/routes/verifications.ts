import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getVerifications, getVerification } from '../controllers/verificationController';

const router = Router();

router.use(protect);

router.get('/', getVerifications);
router.get('/:id', getVerification);

export default router;
