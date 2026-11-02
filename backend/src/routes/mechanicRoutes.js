import { Router } from 'express';
import { getAllMechanics, getMechanicById } from '../controllers/mechanicController.js';

const router = Router();

router.get('/', getAllMechanics);
router.get('/:id', getMechanicById);

export default router;
