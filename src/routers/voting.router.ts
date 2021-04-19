import { Router } from "express";
import { VotingController } from "../controllers/voting.controller";

const router = Router();

router.post("/", VotingController.addVote);
router.get("/", VotingController.getVoting);

export = router;
