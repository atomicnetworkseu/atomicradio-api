import { Router } from 'express';
import { ChannelController } from '../controllers/channel.controller';

const router = Router();

router.get('/:id/live', ChannelController.getChannelLive);
router.get('/:id/schedule', ChannelController.getChannelSchedule);
router.get('/:id/listeners', ChannelController.getChannelListeners);
router.get('/:id/history', ChannelController.getChannelHistory);
router.get('/:id/song', ChannelController.getChannelSong);
router.get('/:id', ChannelController.getChannelById);
router.get('/', ChannelController.getChannels);

export = router;