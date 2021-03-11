import { Router } from 'express';
import { ChannelController } from '../controllers/channel.controller';

const router = Router();

router.get('/:id/live', ChannelController.getChannelLive);
router.post('/:id/live', ChannelController.updateChannelLive);
router.get('/:id/schedule', ChannelController.getChannelSchedule);
router.get('/:id/listeners', ChannelController.getChannelListeners);
router.get('/:id/description', ChannelController.getChannelDescription);
router.get('/:id/history', ChannelController.getChannelHistory);
router.get('/:id/song', ChannelController.getChannelSong);
router.get('/:id', ChannelController.getChannelById);
router.get('/', ChannelController.getChannels);

export = router;