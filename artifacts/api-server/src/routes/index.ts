import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import cardsRouter from "./cards";
import packsRouter from "./packs";
import gachaRouter from "./gacha";
import collectionRouter from "./collection";
import walletRouter from "./wallet";
import paymentsRouter from "./payments";
import leaderboardRouter from "./leaderboard";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cardsRouter);
router.use(packsRouter);
router.use(gachaRouter);
router.use(collectionRouter);
router.use(walletRouter);
router.use(paymentsRouter);
router.use(leaderboardRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(uploadRouter);

export default router;
