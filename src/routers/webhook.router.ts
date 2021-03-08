import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

router.post('/azuracast/stream', WebhookController.azuracastStream);

export = router;