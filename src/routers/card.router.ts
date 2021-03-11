import { Router } from "express";
import { CardController } from "../controllers/card.controller";

const router = Router();

router.get("/", CardController.getSongCard);

export = router;
